// src/pages/CryptsPage.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCrypts } from "../hooks/useCrypts";
import { apiService } from "../services/apiService";
import type { Crypt, CryptPayload } from "../types/crypt";
import type { CryptRemain } from "../types/cryptRemain";
import type { Payment, PaymentPayload } from "../types/payment";
import type { Client, ClientPayload } from "../types/client";
import CryptTable from "../components/crypts/CryptTable";
import CryptDetail, {
  type EditableCryptDetails,
} from "../components/crypts/CryptDetail";
import SaleForm, { type SaleDetails } from "../components/crypts/SaleForm";
import PaymentForm from "../components/payment/PaymentForm";
import Modal from "../components/common/Modal";
import ConfirmModal from "../components/common/ConfirmModal";
import ToastMessage from "../components/common/ToastMessage";
import PageLoader from "../components/common/PageLoader";
import { getApiErrorMessage } from "../utils/apiError";
import { getBackendDateTime } from "../utils/date";
import { formatCurrency } from "../utils/format";
import { getEffectiveCryptBalanceDue } from "../utils/cryptOwnership";

type AvailabilityFilter = "all" | "available" | "occupied";
type PaymentStatusFilter = "all" | "no-payment" | "paying" | "completed";
type PresenceFilter = "all" | "yes" | "no";
type SortColumn =
  | "cryptCode"
  | "title"
  | "client"
  | "beneficiary"
  | "remains"
  | "plateText"
  | "cost"
  | "totalPaid"
  | "balanceDue"
  | "paymentsCount"
  | "purchaseDate"
  | "paymentStatus";
type SortDirection = "asc" | "desc";
type PendingCryptUpdate = CryptPayload & {
  beneficiary?: ClientPayload;
};

const availabilityFilterValues: AvailabilityFilter[] = [
  "all",
  "available",
  "occupied",
];
const paymentStatusFilterValues: PaymentStatusFilter[] = [
  "all",
  "no-payment",
  "paying",
  "completed",
];
const presenceFilterValues: PresenceFilter[] = ["all", "yes", "no"];
const sortColumnValues: SortColumn[] = [
  "cryptCode",
  "title",
  "client",
  "beneficiary",
  "remains",
  "plateText",
  "cost",
  "totalPaid",
  "balanceDue",
  "paymentsCount",
  "purchaseDate",
  "paymentStatus",
];

function getCryptPaymentStatus(
  crypt: Crypt
): Exclude<PaymentStatusFilter, "all"> | null {
  if (crypt.isAvailable) return null;
  
  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = getEffectiveCryptBalanceDue(crypt);

  if (totalPaid <= 0) return "no-payment";
  if (balanceDue > 0) return "paying";

  return "completed";
}

function getClientName(client: Crypt["client"] | Crypt["beneficiary"]) {
  if (!client) return "";

  return `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim();
}

function getClientSearchText(client: Crypt["client"] | Crypt["beneficiary"]) {
  if (!client) return "";

  return [
    client.firstName,
    client.lastName,
    client.phoneNumber,
    client.alternatePhoneNumber,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getCryptCode(crypt: Crypt) {
  return `${crypt.section}-${crypt.letter}-${crypt.number}`;
}

function normalizeCryptCodeSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getComparableDate(value?: string | null) {
  return getBackendDateTime(value);
}

function getActiveRemainsCountFromCrypt(crypt: Crypt) {
  const remains = crypt.cryptRemains ?? [];

  return remains.filter((remain) => remain?.isActive ?? true).length;
}

function getDateInputTime(value: string, boundary: "start" | "end") {
  if (!value) return null;

  const suffix = boundary === "start" ? "T00:00:00" : "T23:59:59";
  const time = new Date(`${value}${suffix}`).getTime();

  return Number.isNaN(time) ? null : time;
}

function matchesPresenceFilter(hasValue: boolean, filter: PresenceFilter) {
  if (filter === "all") return true;

  return filter === "yes" ? hasValue : !hasValue;
}

function compareValues(
  firstValue: string | number | null,
  secondValue: string | number | null,
  direction: SortDirection
) {
  if (firstValue === null && secondValue === null) return 0;
  if (firstValue === null) return direction === "asc" ? 1 : -1;
  if (secondValue === null) return direction === "asc" ? -1 : 1;

  const result =
    typeof firstValue === "number" && typeof secondValue === "number"
      ? firstValue - secondValue
      : firstValue.toString().localeCompare(secondValue.toString(), "es-MX", {
          numeric: true,
          sensitivity: "base",
        });

  return direction === "asc" ? result : -result;
}

function CryptsPage() {
  const { crypts, loading, error, loadCrypts } = useCrypts();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsLoaded, setClientsLoaded] = useState(false);

  const [selectedCryptForDetail, setSelectedCryptForDetail] =
    useState<Crypt | null>(null);
  const [editingDetailCrypt, setEditingDetailCrypt] = useState(false);
  const [pendingCryptUpdate, setPendingCryptUpdate] =
    useState<PendingCryptUpdate | null>(null);
  const [detailPayments, setDetailPayments] = useState<Payment[]>([]);
  const [detailPaymentsLoading, setDetailPaymentsLoading] = useState(false);
  const [detailPaymentsError, setDetailPaymentsError] = useState("");
  const [detailRemains, setDetailRemains] = useState<CryptRemain[]>([]);
  const [detailRemainsLoading, setDetailRemainsLoading] = useState(false);
  const [detailRemainsError, setDetailRemainsError] = useState("");
  const [openingDetail, setOpeningDetail] = useState(false);

  const [selectedCryptForSale, setSelectedCryptForSale] =
    useState<Crypt | null>(null);

  const [selectedCryptForPayment, setSelectedCryptForPayment] =
    useState<Crypt | null>(null);

  const [selectedCryptForRemain, setSelectedCryptForRemain] =
    useState<Crypt | null>(null);
  const [remainName, setRemainName] = useState("");
  const [remainFormError, setRemainFormError] = useState("");
  const [remainModalError, setRemainModalError] = useState("");
  const [confirmingRemainCreation, setConfirmingRemainCreation] =
    useState(false);

  const [cryptToCancelPurchase, setCryptToCancelPurchase] =
    useState<Crypt | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>("all");
  const [purchaseDateFrom, setPurchaseDateFrom] = useState("");
  const [purchaseDateTo, setPurchaseDateTo] = useState("");
  const [beneficiaryFilter, setBeneficiaryFilter] =
    useState<PresenceFilter>("all");
  const [titleFilter, setTitleFilter] = useState<PresenceFilter>("all");
  const [plateFilter, setPlateFilter] = useState<PresenceFilter>("all");
  const [debtOnlyFilter, setDebtOnlyFilter] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("cryptCode");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [savingCrypt, setSavingCrypt] = useState(false);
  const [savingSale, setSavingSale] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingRemain, setSavingRemain] = useState(false);
  const [cancelingPurchase, setCancelingPurchase] = useState(false);

  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [paymentModalError, setPaymentModalError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const isBusy =
    savingCrypt ||
    savingSale ||
    savingPayment ||
    savingRemain ||
    cancelingPurchase ||
    openingDetail;
  const isPageLoading = loading || (clientsLoading && clients.length === 0);
  const searchParamsKey = searchParams.toString();

  const validCrypts = useMemo(() => {
    return crypts.filter(
      (crypt): crypt is Crypt => crypt !== null && crypt !== undefined
    );
  }, [crypts]);

  const activeRemainsCountByCryptId = useMemo(() => {
    return validCrypts.reduce<Record<number, number>>((counts, crypt) => {
      if (!crypt.id) return counts;

      counts[crypt.id] = getActiveRemainsCountFromCrypt(crypt);

      return counts;
    }, {});
  }, [validCrypts]);

  const loadClients = useCallback(async (): Promise<Client[]> => {
    try {
      setClientsLoading(true);

      const data = await apiService.clients.getClientsBalance();

      const safeClients = Array.isArray(data)
        ? data.filter(
            (client): client is Client =>
              client !== null && client !== undefined
          )
        : [];

      setClients(safeClients);
      setClientsLoaded(true);
      return safeClients;
    } catch (err) {
      console.error("Error loading clients:", err);
      setPageError(
        getApiErrorMessage(err, "No se pudieron cargar los clientes.")
      );
      setClients([]);
      setClientsLoaded(false);
      return [];
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const ensureClientsLoaded = useCallback(async () => {
    if (clientsLoaded) return clients;

    return loadClients();
  }, [clients, clientsLoaded, loadClients]);

  useEffect(() => {
    const currentSearchParams = new URLSearchParams(searchParamsKey);
    const availabilityParam = currentSearchParams.get("availability");
    const paymentStatusParam = currentSearchParams.get("paymentStatus");
    const beneficiaryParam = currentSearchParams.get("beneficiary");
    const titleParam = currentSearchParams.get("title");
    const plateParam = currentSearchParams.get("plate");
    const sortParam = currentSearchParams.get("sort");
    const directionParam = currentSearchParams.get("direction");
    const searchParam = currentSearchParams.get("search");
    const focusSearchParam = currentSearchParams.get("focusSearch");

    setSearchTerm(searchParam ?? "");
    setAvailabilityFilter(
      availabilityFilterValues.includes(availabilityParam as AvailabilityFilter)
        ? (availabilityParam as AvailabilityFilter)
        : "all"
    );
    setPaymentStatusFilter(
      paymentStatusFilterValues.includes(
        paymentStatusParam as PaymentStatusFilter
      )
        ? (paymentStatusParam as PaymentStatusFilter)
        : "all"
    );
    setBeneficiaryFilter(
      presenceFilterValues.includes(beneficiaryParam as PresenceFilter)
        ? (beneficiaryParam as PresenceFilter)
        : "all"
    );
    setTitleFilter(
      presenceFilterValues.includes(titleParam as PresenceFilter)
        ? (titleParam as PresenceFilter)
        : "all"
    );
    setPlateFilter(
      presenceFilterValues.includes(plateParam as PresenceFilter)
        ? (plateParam as PresenceFilter)
        : "all"
    );
    setDebtOnlyFilter(currentSearchParams.get("debt") === "due");
    setSortColumn(
      sortColumnValues.includes(sortParam as SortColumn)
        ? (sortParam as SortColumn)
        : "cryptCode"
    );
    setSortDirection(directionParam === "desc" ? "desc" : "asc");
    setSectionFilter("all");
    setPurchaseDateFrom("");
    setPurchaseDateTo("");

    if (focusSearchParam === "1") {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    if (searchParamsKey) {
      setFiltersOpen(true);
    }
  }, [searchParamsKey]);

  const filteredCrypts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedCryptCodeSearch =
      normalizeCryptCodeSearch(normalizedSearch);
    const purchaseFromTime = getDateInputTime(purchaseDateFrom, "start");
    const purchaseToTime = getDateInputTime(purchaseDateTo, "end");

    const getBeneficiaryClient = (crypt: Crypt) => {
      return crypt.beneficiary ?? null;
    };

    const getSortValue = (crypt: Crypt): string | number | null => {
      const beneficiaryClient = getBeneficiaryClient(crypt);

      switch (sortColumn) {
        case "cryptCode":
          return getCryptCode(crypt);
        case "title":
          return crypt.title?.trim() || null;
        case "client":
          return getClientName(crypt.client) || null;
        case "beneficiary":
          return getClientName(beneficiaryClient) || null;
        case "remains":
          return crypt.id ? activeRemainsCountByCryptId[crypt.id] ?? 0 : 0;
        case "plateText":
          return crypt.plateText?.trim() || null;
        case "cost":
          return crypt.cost ?? 0;
        case "totalPaid":
          return crypt.balance?.totalPaid ?? 0;
        case "balanceDue":
          return getEffectiveCryptBalanceDue(crypt);
        case "paymentsCount":
          return crypt.balance?.paymentsCount ?? 0;
        case "purchaseDate":
          return getComparableDate(crypt.purchasedAt);
        case "paymentStatus": {
          const paymentStatusOrder: Record<
            Exclude<PaymentStatusFilter, "all">,
            number
          > = {
            "no-payment": 1,
            paying: 2,
            completed: 3,
          };
          const status = getCryptPaymentStatus(crypt);

          return status ? paymentStatusOrder[status] : null;
        }
        default:
          return getCryptCode(crypt);
      }
    };

    return validCrypts.filter((crypt) => {
      const section = crypt.section?.toString() ?? "";
      const letter = crypt.letter?.toLowerCase() ?? "";
      const number = crypt.number?.toLowerCase() ?? "";

      const cryptCode = getCryptCode(crypt).toLowerCase();
      const searchableCryptCode = normalizeCryptCodeSearch(cryptCode);

      const beneficiaryClient = getBeneficiaryClient(crypt);
      const clientName = getClientName(crypt.client).toLowerCase();
      const clientSearchText = getClientSearchText(crypt.client);
      const beneficiarySearchText = getClientSearchText(beneficiaryClient);
      const hasBeneficiary = Boolean(crypt.beneficiaryId || beneficiaryClient);
      const hasTitle = Boolean(crypt.title?.trim());
      const hasPlate = Boolean(crypt.plateText?.trim());
      const purchaseDateTime = getComparableDate(crypt.purchasedAt);

      const matchesSearch =
        normalizedSearch === "" ||
        cryptCode.includes(normalizedSearch) ||
        (normalizedCryptCodeSearch !== "" &&
          searchableCryptCode.includes(normalizedCryptCodeSearch)) ||
        section.includes(normalizedSearch) ||
        letter.includes(normalizedSearch) ||
        number.includes(normalizedSearch) ||
        clientName.includes(normalizedSearch) ||
        clientSearchText.includes(normalizedSearch) ||
        beneficiarySearchText.includes(normalizedSearch);

      const isAvailable = Boolean(crypt.isAvailable);
      const matchesSection =
        sectionFilter === "all" || crypt.section.toString() === sectionFilter;

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && isAvailable) ||
        (availabilityFilter === "occupied" && !isAvailable);

      const matchesDebtOnly =
        !debtOnlyFilter ||
        (!isAvailable && getEffectiveCryptBalanceDue(crypt) > 0);

      const matchesPaymentStatus =
        paymentStatusFilter === "all" ||
        getCryptPaymentStatus(crypt) === paymentStatusFilter;

      const matchesPurchaseDateFrom =
        purchaseFromTime === null ||
        (purchaseDateTime !== null && purchaseDateTime >= purchaseFromTime);

      const matchesPurchaseDateTo =
        purchaseToTime === null ||
        (purchaseDateTime !== null && purchaseDateTime <= purchaseToTime);

      const matchesBeneficiary = matchesPresenceFilter(
        hasBeneficiary,
        beneficiaryFilter
      );

      const matchesTitle = matchesPresenceFilter(hasTitle, titleFilter);

      const matchesPlate = matchesPresenceFilter(hasPlate, plateFilter);

      return (
        matchesSearch &&
        matchesSection &&
        matchesAvailability &&
        matchesDebtOnly &&
        matchesPaymentStatus &&
        matchesPurchaseDateFrom &&
        matchesPurchaseDateTo &&
        matchesBeneficiary &&
        matchesTitle &&
        matchesPlate
      );
    }).sort((firstCrypt, secondCrypt) => {
      return compareValues(
        getSortValue(firstCrypt),
        getSortValue(secondCrypt),
        sortDirection
      );
    });
  }, [
    validCrypts,
    searchTerm,
    sectionFilter,
    availabilityFilter,
    paymentStatusFilter,
    debtOnlyFilter,
    purchaseDateFrom,
    purchaseDateTo,
    beneficiaryFilter,
    titleFilter,
    plateFilter,
    sortColumn,
    sortDirection,
    activeRemainsCountByCryptId,
  ]);

  const sectionOptions = useMemo(() => {
    return Array.from(new Set(validCrypts.map((crypt) => crypt.section))).sort(
      (a, b) => a - b
    );
  }, [validCrypts]);

  const cryptSummary = useMemo(() => {
    const totalCrypts = validCrypts.length;

    const availableCrypts = validCrypts.filter((crypt) =>
      Boolean(crypt.isAvailable)
    ).length;

    const occupiedCrypts = validCrypts.filter(
      (crypt) => !crypt.isAvailable
    ).length;

    const soldCrypts = validCrypts.filter((crypt) => !crypt.isAvailable);

    const totalAmount = soldCrypts.reduce((sum, crypt) => {
      return sum + (crypt.cost ?? 0);
    }, 0);

    const totalPaid = soldCrypts.reduce((sum, crypt) => {
      return sum + (crypt.balance?.totalPaid ?? 0);
    }, 0);

    const totalBalanceDue = soldCrypts.reduce((sum, crypt) => {
      return sum + getEffectiveCryptBalanceDue(crypt);
    }, 0);

    return {
      totalCrypts,
      availableCrypts,
      occupiedCrypts,
      totalAmount,
      totalPaid,
      totalBalanceDue,
    };
  }, [validCrypts]);

  const clearPageMessages = () => {
    setPageError("");
    setPageMessage("");
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSectionFilter("all");
    setAvailabilityFilter("all");
    setPaymentStatusFilter("all");
    setPurchaseDateFrom("");
    setPurchaseDateTo("");
    setBeneficiaryFilter("all");
    setTitleFilter("all");
    setPlateFilter("all");
    setDebtOnlyFilter(false);
    setSortColumn("cryptCode");
    setSortDirection("asc");
    setSearchParams({});
  };

  const getCryptClientId = (crypt: Crypt) => {
    return crypt.clientId ?? crypt.client?.id;
  };

  const getActiveRemains = (remains: CryptRemain[]) => {
    return remains.filter((remain) => remain.isActive ?? true);
  };

  const refreshDetailRemains = useCallback(async (cryptId: number) => {
    const remains = await apiService.cryptRemains.getByCryptId(cryptId);
    const safeRemains = Array.isArray(remains) ? remains : [];

    if (selectedCryptForDetail?.id === cryptId) {
      setDetailRemains(safeRemains);
    }

    return safeRemains;
  }, [selectedCryptForDetail?.id]);

  const handleViewCryptDetails = async (crypt: Crypt) => {
    clearPageMessages();
    setEditingDetailCrypt(false);
    setDetailPayments([]);
    setDetailRemains([]);
    setDetailPaymentsError("");
    setDetailRemainsError("");

    if (!crypt.id) {
      setSelectedCryptForDetail(crypt);
      return;
    }

    try {
      setOpeningDetail(true);
      setDetailPaymentsLoading(true);
      setDetailRemainsLoading(true);

      const [payments, remains] = await Promise.all([
        apiService.payments.getHistory(undefined, crypt.id),
        apiService.cryptRemains.getByCryptId(crypt.id),
        ensureClientsLoaded(),
      ]);

      setDetailPayments(Array.isArray(payments) ? payments : []);
      setDetailRemains(Array.isArray(remains) ? remains : []);
    } catch (err) {
      console.error("Error loading crypt detail:", err);
      setDetailPayments([]);
      setDetailRemains([]);
      setDetailPaymentsError(
        getApiErrorMessage(err, "No se pudieron cargar los pagos.")
      );
      setDetailRemainsError(
        getApiErrorMessage(err, "No se pudieron cargar los restos.")
      );
    } finally {
      setDetailPaymentsLoading(false);
      setDetailRemainsLoading(false);
      setOpeningDetail(false);
      setSelectedCryptForDetail(crypt);
    }
  };

  const handleUpdateCrypt = async (crypt: PendingCryptUpdate) => {
    if (!crypt.id || savingCrypt) return;

    try {
      setSavingCrypt(true);
      clearPageMessages();

      let beneficiaryId = crypt.beneficiaryId ?? null;

      if (crypt.beneficiary) {
        const createdBeneficiary = await apiService.clients.create(
          crypt.beneficiary
        );

        if (!createdBeneficiary.id) {
          throw new Error("No se pudo identificar el beneficiario creado.");
        }

        beneficiaryId = createdBeneficiary.id;
      }

      const cryptPayload: CryptPayload = {
        id: crypt.id,
        clientId: crypt.clientId,
        beneficiaryId,
        saleCryptStatusId: crypt.saleCryptStatusId,
        title: crypt.title,
        plateText: crypt.plateText,
        isAvailable: crypt.isAvailable,
        purchasedAt: crypt.purchasedAt,
        createdAt: crypt.createdAt,
        cost: crypt.cost,
        section: crypt.section,
        letter: crypt.letter,
        number: crypt.number,
      };

      await apiService.crypts.update(crypt.id, cryptPayload);

      setPageMessage("Cripta actualizada correctamente.");

      await loadCrypts();
      setClientsLoaded(false);
      setSelectedCryptForDetail((prev) =>
        prev?.id === crypt.id ? { ...prev, ...cryptPayload, beneficiaryId } : prev
      );
      setEditingDetailCrypt(false);
      setPendingCryptUpdate(null);
    } catch (err) {
      console.error("Error updating crypt:", err);
      setPageError(getApiErrorMessage(err, "No se pudo actualizar la cripta."));
    } finally {
      setSavingCrypt(false);
    }
  };

  const handleRegisterSale = (crypt: Crypt) => {
    clearPageMessages();

    if (!crypt.id) {
      setPageError("La cripta seleccionada no es válida.");
      return;
    }

    if (!crypt.isAvailable) {
      setPageError("Esta cripta ya está ocupada.");
      return;
    }

    void ensureClientsLoaded();
    setSelectedCryptForSale(crypt);
  };

  const handleCreateSale = async (
    mode: "existing" | "new",
    clientData: number | ClientPayload,
    initialPayment?: Omit<PaymentPayload, "paidByClientId">,
    saleDetails?: SaleDetails
  ) => {
    if (!selectedCryptForSale?.id || savingSale) return;

    try {
      setSavingSale(true);
      clearPageMessages();

      let clientId: number | undefined;

      if (mode === "existing") {
        clientId = clientData as number;
      }

      if (mode === "new") {
        const createdClient = await apiService.clients.create(
          clientData as ClientPayload
        );

        clientId = createdClient.id;
      }

      if (!clientId) {
        setPageError("No se pudo identificar el cliente para la venta.");
        return;
      }

      let beneficiaryId: number | null = saleDetails?.beneficiaryId ?? null;

      if (saleDetails?.beneficiary) {
        const createdBeneficiary = await apiService.clients.create(
          saleDetails.beneficiary
        );

        beneficiaryId = createdBeneficiary.id ?? null;
      }

      const assignedCrypt = await apiService.crypts.assignOwner(
        selectedCryptForSale.id,
        clientId
      );

      if (
        beneficiaryId ||
        saleDetails?.title?.trim() ||
        saleDetails?.plateText?.trim()
      ) {
        await apiService.crypts.update(assignedCrypt.id ?? selectedCryptForSale.id, {
          id: assignedCrypt.id ?? selectedCryptForSale.id,
          clientId: assignedCrypt.clientId ?? clientId,
          beneficiaryId,
          saleCryptStatusId: assignedCrypt.saleCryptStatusId ?? null,
          isAvailable: assignedCrypt.isAvailable ?? false,
          purchasedAt:
            assignedCrypt.purchasedAt ?? selectedCryptForSale.purchasedAt ?? null,
          createdAt: assignedCrypt.createdAt,
          section: assignedCrypt.section,
          letter: assignedCrypt.letter,
          number: assignedCrypt.number,
          cost: assignedCrypt.cost,
          title: saleDetails?.title?.trim() || null,
          plateText: saleDetails?.plateText?.trim() || null,
        });
      }

      if (initialPayment) {
        await apiService.payments.create({
          ...initialPayment,
          cryptId: assignedCrypt.id ?? selectedCryptForSale.id,
          paidByClientId: assignedCrypt.clientId ?? clientId,
        });
      }

      setSelectedCryptForSale(null);
      setPageMessage("Venta registrada correctamente.");

      await loadCrypts();
      setClientsLoaded(false);
    } catch (err) {
      console.error("Error creating sale:", err);
      setPageError(getApiErrorMessage(err, "No se pudo registrar la venta."));
    } finally {
      setSavingSale(false);
    }
  };

  const handleRegisterPayment = (crypt: Crypt) => {
    clearPageMessages();
    setPaymentModalError("");

    if (!crypt.id) {
      setPageError("La cripta seleccionada no es válida.");
      return;
    }

    if (crypt.isAvailable) {
      setPageError("No se puede registrar un pago en una cripta disponible.");
      return;
    }

    const balanceDue = getEffectiveCryptBalanceDue(crypt);

    if (balanceDue <= 0) {
      setPageError("Esta cripta ya está liquidada.");
      return;
    }

    setSelectedCryptForPayment(crypt);
  };

  const handleRequestUpdateCryptDetails = (details: EditableCryptDetails) => {
    if (!selectedCryptForDetail?.id) return;

    setPendingCryptUpdate({
      id: selectedCryptForDetail.id,
      clientId:
        selectedCryptForDetail.clientId ?? selectedCryptForDetail.client?.id ?? null,
      beneficiaryId: details.beneficiaryId ?? null,
      saleCryptStatusId: selectedCryptForDetail.saleCryptStatusId ?? null,
      isAvailable: selectedCryptForDetail.isAvailable ?? true,
      purchasedAt: selectedCryptForDetail.purchasedAt ?? null,
      createdAt: selectedCryptForDetail.createdAt,
      section: selectedCryptForDetail.section,
      letter: selectedCryptForDetail.letter,
      number: selectedCryptForDetail.number,
      cost: details.cost ?? selectedCryptForDetail.cost,
      title: details.title ?? null,
      plateText: details.plateText ?? null,
      beneficiary: details.beneficiary,
    });
  };

  const handleAddRemain = async (crypt: Crypt) => {
    clearPageMessages();
    setRemainFormError("");
    setRemainModalError("");

    if (!crypt.id) {
      setPageError("La cripta seleccionada no es válida.");
      return;
    }

    if (crypt.isAvailable || !getCryptClientId(crypt)) {
      setPageError("Solo se pueden agregar restos a una cripta con dueño.");
      return;
    }

    try {
      setSavingRemain(true);

      const activeRemainsCount = activeRemainsCountByCryptId[crypt.id] ?? 0;

      if (activeRemainsCount >= 4) {
        setPageError("Esta cripta ya tiene el máximo de 4 restos activos.");
        return;
      }

      setSelectedCryptForRemain(crypt);
      setRemainName("");
    } catch (err) {
      console.error("Error validating crypt remains:", err);
      setPageError(
        getApiErrorMessage(err, "No se pudieron validar los restos de la cripta.")
      );
    } finally {
      setSavingRemain(false);
    }
  };

  const handleCreatePayment = async (
    payment: PaymentPayload
  ): Promise<void> => {
    if (!selectedCryptForPayment?.id || savingPayment) return;

    try {
      setSavingPayment(true);
      clearPageMessages();
      setPaymentModalError("");

      await apiService.payments.create({
        ...payment,
        cryptId: selectedCryptForPayment.id,
      });

      setSelectedCryptForPayment(null);
      setPageMessage("Pago registrado correctamente.");

      await loadCrypts();
    } catch (err) {
      console.error("Error creating payment:", err);

      const message = getApiErrorMessage(err, "No se pudo registrar el pago.");
      setPaymentModalError(message);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSubmitRemain = (e: React.FormEvent) => {
    e.preventDefault();

    if (savingRemain) return;

    const normalizedName = remainName.trim();

    if (!normalizedName) {
      setRemainFormError("El nombre del resto es obligatorio.");
      return;
    }

    setRemainFormError("");
    setConfirmingRemainCreation(true);
  };

  const handleConfirmCreateRemain = async () => {
    if (!selectedCryptForRemain?.id || savingRemain) return;

    const normalizedName = remainName.trim();

    if (!normalizedName) {
      setConfirmingRemainCreation(false);
      setRemainFormError("El nombre del resto es obligatorio.");
      return;
    }

    if (
      selectedCryptForRemain.isAvailable ||
      !getCryptClientId(selectedCryptForRemain)
    ) {
      setConfirmingRemainCreation(false);
      setRemainModalError("Solo se pueden agregar restos a una cripta con dueño.");
      return;
    }

    try {
      setSavingRemain(true);
      setRemainModalError("");

      const remains = await apiService.cryptRemains.getByCryptId(
        selectedCryptForRemain.id
      );
      const activeRemains = getActiveRemains(Array.isArray(remains) ? remains : []);

      if (activeRemains.length >= 4) {
        setConfirmingRemainCreation(false);
        setRemainModalError("Esta cripta ya tiene el máximo de 4 restos activos.");
        return;
      }

      await apiService.cryptRemains.create({
        cryptId: selectedCryptForRemain.id,
        deceasedName: normalizedName,
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      await loadCrypts();
      await refreshDetailRemains(selectedCryptForRemain.id);

      setSelectedCryptForRemain(null);
      setRemainName("");
      setConfirmingRemainCreation(false);
      setPageMessage("Resto agregado correctamente.");
    } catch (err) {
      console.error("Error creating crypt remain:", err);
      setConfirmingRemainCreation(false);
      setRemainModalError(
        getApiErrorMessage(err, "No se pudo agregar el resto.")
      );
    } finally {
      setSavingRemain(false);
    }
  };

  const handleCancelPurchase = async (crypt: Crypt) => {
    if (!crypt.id || cancelingPurchase) return;

    if (crypt.isAvailable) {
      setPageError("Esta cripta no tiene una compra activa para cancelar.");
      return;
    }

    clearPageMessages();
    setCryptToCancelPurchase(crypt);
  };

  const handleConfirmCancelPurchase = async () => {
    if (!cryptToCancelPurchase?.id || cancelingPurchase) return;

    try {
      setCancelingPurchase(true);
      clearPageMessages();

      await apiService.crypts.cancelPurchase(cryptToCancelPurchase.id);

      setCryptToCancelPurchase(null);
      setPageMessage("Compra cancelada correctamente.");

      await loadCrypts();
    } catch (err) {
      console.error("Error canceling purchase:", err);
      setPageError(getApiErrorMessage(err, "No se pudo cancelar la compra."));
    } finally {
      setCancelingPurchase(false);
    }
  };

  const handleCloseDetailModal = () => {
    if (savingCrypt) return;

    setSelectedCryptForDetail(null);
    setEditingDetailCrypt(false);
    setPendingCryptUpdate(null);
    setDetailPayments([]);
    setDetailPaymentsError("");
    setDetailRemains([]);
    setDetailRemainsError("");
  };

  const handleCloseSaleModal = () => {
    if (savingSale) return;
    setSelectedCryptForSale(null);
  };

  const handleClosePaymentModal = () => {
    if (savingPayment) return;

    setPaymentModalError("");
    setSelectedCryptForPayment(null);
  };

  const handleCloseRemainModal = () => {
    if (savingRemain) return;

    setSelectedCryptForRemain(null);
    setRemainName("");
    setRemainFormError("");
    setRemainModalError("");
    setConfirmingRemainCreation(false);
  };

  return (
    <>
      <PageLoader
        visible={isPageLoading}
        message="Cargando criptas..."
      />
      <section
        className={`page-container ${isPageLoading ? "page-content-loading" : ""}`}
      >
      <div className="page-header">
        <div>
          <h1>Criptas</h1>
          <p>Consulta, edita y administra ventas de criptas.</p>
        </div>
      </div>

      <div className="toast-stack">
        <ToastMessage type="error" message={error} />
        <ToastMessage
          type="error"
          message={pageError}
          onClose={() => setPageError("")}
        />
        <ToastMessage
          type="success"
          message={pageMessage}
          onClose={() => setPageMessage("")}
        />
      </div>

      <div className="summary-container">
        <div className="summary-card">
          <span>Total criptas</span>
          <strong>{cryptSummary.totalCrypts}</strong>
        </div>

        <div className="summary-card">
          <span>Disponibles</span>
          <strong>{cryptSummary.availableCrypts}</strong>
        </div>

        <div className="summary-card">
          <span>Ocupadas</span>
          <strong>{cryptSummary.occupiedCrypts}</strong>
        </div>

        <div className="summary-card">
          <span>Total vendido</span>
          <strong>{formatCurrency(cryptSummary.totalAmount)}</strong>
        </div>

        <div className="summary-card">
          <span>Total pagado</span>
          <strong>{formatCurrency(cryptSummary.totalPaid)}</strong>
        </div>

        <div className="summary-card">
          <span>Total pendiente</span>
          <strong>{formatCurrency(cryptSummary.totalBalanceDue)}</strong>
        </div>
      </div>

      <details
        className="filters-panel"
        open={filtersOpen}
        onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
      >
        <summary>
          <span>Filtros</span>
          <strong>{filteredCrypts.length} resultados</strong>
        </summary>

        <div className="filters-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClearFilters}
            disabled={isBusy}
          >
            Limpiar filtros
          </button>
        </div>

        <div className="filters-container">
          <div className="form-group filter-search">
            <label>Buscar</label>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por cripta, cliente, beneficiario o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isBusy}
            />
          </div>

          <div className="form-group">
            <label>Disponibilidad</label>
            <select
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(e.target.value as AvailabilityFilter)
              }
              disabled={isBusy}
            >
              <option value="all">Todas</option>
              <option value="available">Disponibles</option>
              <option value="occupied">Ocupadas</option>
            </select>
          </div>

          <div className="form-group">
            <label>Estado de pago</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) =>
                setPaymentStatusFilter(e.target.value as PaymentStatusFilter)
              }
              disabled={isBusy}
            >
              <option value="all">Todos</option>
              <option value="no-payment">Sin pago</option>
              <option value="paying">Abonando</option>
              <option value="completed">Liquidada</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sección</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              disabled={isBusy}
            >
              <option value="all">Todas</option>

              {sectionOptions.map((section) => (
                <option key={section} value={section}>
                  Sección {section}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Compra desde</label>
            <input
              type="date"
              value={purchaseDateFrom}
              onChange={(e) => setPurchaseDateFrom(e.target.value)}
              disabled={isBusy}
            />
          </div>

          <div className="form-group">
            <label>Compra hasta</label>
            <input
              type="date"
              value={purchaseDateTo}
              onChange={(e) => setPurchaseDateTo(e.target.value)}
              disabled={isBusy}
            />
          </div>

          <div className="form-group">
            <label>Beneficiario</label>
            <select
              value={beneficiaryFilter}
              onChange={(e) =>
                setBeneficiaryFilter(e.target.value as PresenceFilter)
              }
              disabled={isBusy}
            >
              <option value="all">Todos</option>
              <option value="yes">Con beneficiario</option>
              <option value="no">Sin beneficiario</option>
            </select>
          </div>

          <div className="form-group">
            <label>Título</label>
            <select
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value as PresenceFilter)}
              disabled={isBusy}
            >
              <option value="all">Todos</option>
              <option value="yes">Con título</option>
              <option value="no">Sin título</option>
            </select>
          </div>

          <div className="form-group">
            <label>Placa</label>
            <select
              value={plateFilter}
              onChange={(e) => setPlateFilter(e.target.value as PresenceFilter)}
              disabled={isBusy}
            >
              <option value="all">Todas</option>
              <option value="yes">Con placa</option>
              <option value="no">Sin placa</option>
            </select>
          </div>
        </div>

        <details className="sort-panel">
          <summary>Ordenar por</summary>

          <div className="sort-controls">
            <div className="form-group">
              <label>Columna</label>
              <select
                value={sortColumn}
                onChange={(e) => setSortColumn(e.target.value as SortColumn)}
                disabled={isBusy}
              >
                <option value="cryptCode">Cripta</option>
                <option value="title">Título</option>
                <option value="client">Cliente</option>
                <option value="beneficiary">Beneficiario</option>
                <option value="remains">Restos</option>
                <option value="plateText">Placa</option>
                <option value="cost">Costo</option>
                <option value="totalPaid">Pagado</option>
                <option value="balanceDue">Saldo</option>
                <option value="paymentsCount">Pagos</option>
                <option value="purchaseDate">Compra</option>
                <option value="paymentStatus">Estado de pago</option>
              </select>
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <select
                value={sortDirection}
                onChange={(e) =>
                  setSortDirection(e.target.value as SortDirection)
                }
                disabled={isBusy}
              >
                <option value="asc">Menor a mayor</option>
                <option value="desc">Mayor a menor</option>
              </select>
            </div>
          </div>
        </details>
      </details>

      <p className="results-count">
        Mostrando {filteredCrypts.length} de {cryptSummary.totalCrypts} criptas
      </p>

      {clientsLoading && <p>Cargando clientes...</p>}

      {loading && <p>Cargando criptas...</p>}

      {!loading && filteredCrypts.length === 0 && (
        <p className="empty-message">
          No se encontraron criptas con los filtros seleccionados.
        </p>
      )}

      {!loading && filteredCrypts.length > 0 && (
        <CryptTable
          crypts={filteredCrypts}
          activeRemainsCountByCryptId={activeRemainsCountByCryptId}
          onViewDetails={handleViewCryptDetails}
          onRegisterSale={handleRegisterSale}
          onRegisterPayment={handleRegisterPayment}
          onAddRemain={handleAddRemain}
          onCancelPurchase={handleCancelPurchase}
        />
      )}

      <Modal
        isOpen={selectedCryptForDetail !== null}
        title="Detalles de cripta"
        onClose={handleCloseDetailModal}
        closeDisabled={savingCrypt}
        size="wide"
      >
        {selectedCryptForDetail && (
          <CryptDetail
            crypt={selectedCryptForDetail}
            clients={clients.filter((client) => client.isActive)}
            payments={detailPayments}
            remains={detailRemains}
            editing={editingDetailCrypt}
            saving={savingCrypt}
            loadingPayments={detailPaymentsLoading}
            paymentsError={detailPaymentsError}
            loadingRemains={detailRemainsLoading}
            remainsError={detailRemainsError}
            purchaseDate={selectedCryptForDetail.purchasedAt ?? undefined}
            onEdit={() => setEditingDetailCrypt(true)}
            onCancelEdit={() => {
              setEditingDetailCrypt(false);
              setPendingCryptUpdate(null);
            }}
            onSaveEdit={handleRequestUpdateCryptDetails}
          />
        )}
      </Modal>

      <Modal
        isOpen={selectedCryptForSale !== null}
        title="Registrar venta"
        onClose={handleCloseSaleModal}
        closeDisabled={savingSale}
      >
        {selectedCryptForSale && (
          <SaleForm
            clients={clients.filter((client) => client.isActive)}
            saving={savingSale}
            maxInitialPayment={
              getEffectiveCryptBalanceDue(selectedCryptForSale) > 0
                ? getEffectiveCryptBalanceDue(selectedCryptForSale)
                : selectedCryptForSale.cost
            }
            onSubmit={handleCreateSale}
            onCancel={handleCloseSaleModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={selectedCryptForPayment !== null}
        title="Registrar pago"
        onClose={handleClosePaymentModal}
        closeDisabled={savingPayment}
      >
        {selectedCryptForPayment?.id && (
          <PaymentForm
            cryptId={selectedCryptForPayment.id}
            paidByClientId={getCryptClientId(selectedCryptForPayment)}
            saving={savingPayment}
            maxAmount={getEffectiveCryptBalanceDue(selectedCryptForPayment)}
            serverError={paymentModalError}
            onSubmit={handleCreatePayment}
            onCancel={handleClosePaymentModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={selectedCryptForRemain !== null}
        title="Agregar resto"
        onClose={handleCloseRemainModal}
        closeDisabled={savingRemain}
      >
        {selectedCryptForRemain && (
          <form className="form-container" onSubmit={handleSubmitRemain}>
            {remainModalError && (
              <p className="error-message">{remainModalError}</p>
            )}
            {remainFormError && <p className="error-message">{remainFormError}</p>}

            <div className="payment-amount-summary">
              <div>
                <span>Cripta</span>
                <strong>
                  {selectedCryptForRemain.section}-
                  {selectedCryptForRemain.letter}-
                  {selectedCryptForRemain.number}
                </strong>
              </div>
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="remain-name">Nombre del resto</label>
              <input
                id="remain-name"
                type="text"
                value={remainName}
                onChange={(e) => {
                  setRemainName(e.target.value);
                  setRemainFormError("");
                }}
                placeholder="Ingresa el nombre"
                disabled={savingRemain}
                maxLength={180}
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseRemainModal}
                disabled={savingRemain}
              >
                Cancelar
              </button>

              <button type="submit" className="btn-primary" disabled={savingRemain}>
                Agregar resto
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={cryptToCancelPurchase !== null}
        title="Cancelar compra"
        message="Los pagos quedarán inactivos y la cripta volverá a estar disponible."
        confirmLabel="Cancelar compra"
        confirmClassName="btn-danger"
        confirming={cancelingPurchase}
        onConfirm={handleConfirmCancelPurchase}
        onCancel={() => {
          if (!cancelingPurchase) {
            setCryptToCancelPurchase(null);
          }
        }}
      />

      <ConfirmModal
        isOpen={confirmingRemainCreation}
        title="Confirmar resto"
        message="¿Seguro que quieres agregar este resto a la cripta?"
        confirmLabel="Agregar resto"
        confirming={savingRemain}
        onConfirm={handleConfirmCreateRemain}
        onCancel={() => {
          if (!savingRemain) {
            setConfirmingRemainCreation(false);
          }
        }}
      />

      <ConfirmModal
        isOpen={pendingCryptUpdate !== null}
        title="Editar cripta"
        message="¿Seguro que quieres editar esta cripta?"
        confirmLabel="Guardar cambios"
        confirming={savingCrypt}
        onConfirm={() => {
          if (pendingCryptUpdate) {
            handleUpdateCrypt(pendingCryptUpdate);
          }
        }}
        onCancel={() => {
          if (!savingCrypt) {
            setPendingCryptUpdate(null);
          }
        }}
      />
      </section>
    </>
  );
}

export default CryptsPage;
