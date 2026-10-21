import { truncateHex } from "@/lib/hybrid-signature";
import { CopyValue, Section } from "./primitives";
import type { PayloadErrors, TransactionPayload as Payload } from "./types";

interface Props {
  payload: Payload;
  errors: PayloadErrors;
  hash: string | null;
  disabled: boolean;
  onChange: (next: Payload) => void;
}

export function TransactionPayload({ payload, errors, hash, disabled, onChange }: Props) {
  return (
    <Section id="payload-heading" index="01" title="Transaction Payload" divider={false}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()} noValidate>
        <Field id="recipient" label="Recipient" error={errors.recipient}>
          <input
            id="recipient"
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={payload.recipient}
            disabled={disabled}
            aria-invalid={!!errors.recipient}
            aria-describedby={errors.recipient ? "recipient-error" : undefined}
            onChange={(e) => onChange({ ...payload, recipient: e.target.value })}
            className="field"
          />
        </Field>

        <Field id="amount" label="Amount" error={errors.amount}>
          <div className="relative">
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={payload.amount}
              disabled={disabled}
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? "amount-error" : undefined}
              onChange={(e) => onChange({ ...payload, amount: e.target.value })}
              className="field pr-12"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center label-caps text-faint">
              ETH
            </span>
          </div>
        </Field>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span id="msg-hash-label" className="label-caps text-muted-foreground">
              Message Hash
            </span>
            <span className="label-caps text-faint">SHA-256</span>
          </div>
          {hash ? (
            <CopyValue
              value={`0x${hash}`}
              display={truncateHex(hash, 12, 8)}
              label="message hash"
              className="border-dashed"
              textClassName="text-accent"
            />
          ) : (
            <div aria-labelledby="msg-hash-label" className="field border-dashed opacity-40">
              — invalid payload —
            </div>
          )}
          <p className="mt-2 text-label text-faint">
            H(&#123;to, value, unit&#125;) · read-only · recomputed on input
          </p>
        </div>
      </form>
    </Section>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block label-caps text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-label text-compromised-text">
          ERR · {error}
        </p>
      )}
    </div>
  );
}
