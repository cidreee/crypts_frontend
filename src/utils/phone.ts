export const PHONE_COUNTRY_CODES = ["+52", "+1"] as const;

export type PhoneCountryCode = (typeof PHONE_COUNTRY_CODES)[number];

export type PhoneFields = {
  phoneCountryCode: PhoneCountryCode;
  phoneNumber: string;
};

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function splitPhoneNumber(phone?: string | null): PhoneFields {
  if (!phone) {
    return {
      phoneCountryCode: "+52",
      phoneNumber: "",
    };
  }

  const countryCode = PHONE_COUNTRY_CODES.find((code) =>
    phone.startsWith(code)
  );

  if (!countryCode) {
    return {
      phoneCountryCode: "+52",
      phoneNumber: onlyDigits(phone),
    };
  }

  return {
    phoneCountryCode: countryCode,
    phoneNumber: onlyDigits(phone.slice(countryCode.length)),
  };
}

export function buildPhoneNumber({
  phoneCountryCode,
  phoneNumber,
}: PhoneFields) {
  const normalizedPhone = onlyDigits(phoneNumber);

  if (!normalizedPhone) {
    return null;
  }

  return `${phoneCountryCode}${normalizedPhone}`;
}

export function validatePhoneNumber({
  phoneCountryCode,
  phoneNumber,
}: PhoneFields) {
  const normalizedPhone = onlyDigits(phoneNumber);

  if (!normalizedPhone) {
    return "";
  }

  if (phoneCountryCode === "+52" && normalizedPhone.length !== 10) {
    return "El número celular de México debe tener 10 dígitos.";
  }

  if (phoneCountryCode === "+1" && normalizedPhone.length !== 10) {
    return "El número de Estados Unidos/Canadá debe tener 10 dígitos.";
  }

  return "";
}
