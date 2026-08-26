export type DomainIssue = {
  code: string;
  path?: string;
  details?: Record<string, unknown>;
};

export type DomainResult<T> =
  | {
      ok: true;
      value: T;
      warnings?: DomainIssue[];
    }
  | {
      ok: false;
      issues: DomainIssue[];
    };

export function domainSuccess<T>(
  value: T,
  warnings?: DomainIssue[],
): DomainResult<T> {
  return warnings?.length
    ? { ok: true, value, warnings }
    : { ok: true, value };
}

export function domainFailure<T = never>(
  ...issues: DomainIssue[]
): DomainResult<T> {
  return {
    ok: false,
    issues,
  };
}
