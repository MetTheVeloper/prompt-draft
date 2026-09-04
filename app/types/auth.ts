export type AuthUser = {
  id: string;
  username: string | null;
  email: string | null;
  createdAt: string;
};

export type AuthIdentifierType = "username" | "email";

export type IdentifyAuthResponse = {
  ok: true;
  exists: boolean;
  identifierType: AuthIdentifierType;
  identifier: string;
};

export type AuthSessionResponse = {
  ok: true;
  token: string;
  user: AuthUser;
};

export type AuthMeResponse = {
  ok: true;
  user: AuthUser;
};

export type AuthLogoutResponse = {
  ok: true;
};
