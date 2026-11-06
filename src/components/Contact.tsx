import { useRef, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { GITHUB, Magnetic, Words } from './primitives';

const ADDRESS = 'safirabdelaali@gmail.com';
// Web3Forms emails ADDRESS. The key is designed to be public; if it is ever set back to a
// PASTE_ placeholder, the form sends nothing and shows the email address instead.
const WEB3FORMS_KEY = '2f99712c-850c-4308-af89-02b062c9c72e';

type Field = 'name' | 'email' | 'message';
type ErrorKey = 'nameRequired' | 'emailRequired' | 'emailInvalid' | 'messageRequired';
type Status = 'sent' | 'notConnected' | 'failed' | null;

const validate: Record<Field, (v: string) => ErrorKey | null> = {
  name: (v) => (v ? null : 'nameRequired'),
  email: (v) => (!v ? 'emailRequired' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'emailInvalid'),
  message: (v) => (v ? null : 'messageRequired'),
};
const FIELDS: Field[] = ['name', 'email', 'message'];

export function Contact() {
  const { t } = useI18n();
  const c = t.contact;
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, ErrorKey>>>({});
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const value = (name: string) => ((form.current!.elements.namedItem(name) as HTMLInputElement).value ?? '').trim();
  const check = (name: Field) => {
    const error = validate[name](value(name));
    setErrors((prev) => ({ ...prev, [name]: error ?? undefined }));
    return !error;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    const bad = FIELDS.filter((name) => !check(name));
    if (bad.length) {
      (form.current!.elements.namedItem(bad[0]) as HTMLElement).focus();
      return;
    }
    if ((form.current!.elements.namedItem('botcheck') as HTMLInputElement).checked) {
      form.current!.reset();
      setStatus('sent');
      return;
    }
    if (WEB3FORMS_KEY.startsWith('PASTE_')) {
      setStatus('notConnected');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    setBusy(true);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Portfolio message from ${value('name')}`,
          from_name: 'Portfolio contact form',
          name: value('name'),
          email: value('email'),
          message: value('message'),
        }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success !== true) throw new Error('send failed');
      form.current?.reset();
      setStatus('sent');
    } catch {
      setStatus('failed');
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  };

  const field = (name: Field, label: string, control: 'input' | 'textarea', extra: Record<string, unknown> = {}) => {
    const Control = control;
    const error = errors[name];
    return (
      <div className="field">
        <label htmlFor={`f-${name}`}>{label}</label>
        <Control
          id={`f-${name}`}
          name={name}
          aria-describedby={`e-${name}`}
          aria-invalid={error ? true : undefined}
          required
          onBlur={(e: { target: { value: string } }) => {
            if (e.target.value.trim() || error) check(name);
          }}
          onInput={() => {
            if (error) check(name);
          }}
          {...extra}
        />
        <p className="err" id={`e-${name}`}>
          {error ? c.errors[error] : ''}
        </p>
      </div>
    );
  };

  return (
    <section id="contact" className="sec">
      <Words as="h2" className="sec-title" text={c.title} />
      <div className="mx-auto max-w-[560px]">
        <div className="socials" data-reveal="rise">
          <Magnetic strength={0.3}>
            <a className="social" href={GITHUB} target="_blank" rel="noopener">
              <span className="social-disc">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.480 2 2 6.590 2 12.250c0 4.530 2.870 8.370 6.840 9.730.5.090.68-.22.68-.490 0-.240-.010-.890-.010-1.750-2.780.620-3.370-1.370-3.370-1.370-.450-1.180-1.110-1.490-1.110-1.490-.910-.640.070-.630.070-.630 1 .070 1.530 1.060 1.530 1.060.890 1.570 2.340 1.120 2.910.850.090-.660.350-1.120.630-1.370-2.220-.260-4.560-1.140-4.560-5.080 0-1.120.390-2.040 1.030-2.760-.100-.260-.450-1.300.100-2.710 0 0 .840-.280 2.750 1.050A9.300 9.300 0 0 1 12 6.970c.850 0 1.700.120 2.500.340 1.910-1.330 2.750-1.050 2.750-1.050.550 1.410.200 2.450.100 2.710.640.720 1.030 1.640 1.030 2.760 0 3.950-2.340 4.820-4.570 5.070.360.320.680.940.680 1.900 0 1.370-.010 2.480-.010 2.810 0 .270.180.590.690.490A10.150 10.150 0 0 0 22 12.250C22 6.590 17.520 2 12 2z" />
                </svg>
              </span>
              GitHub
            </a>
          </Magnetic>
          <Magnetic strength={0.3}>
            <a className="social" href="https://www.linkedin.com/in/abdelaali-safir-0b34aa29b/" target="_blank" rel="noopener">
              <span className="social-disc">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M6.940 8.500H3.560V20h3.380zM5.250 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM20.500 13.400c0-3.100-1.650-5.150-4.300-5.150-1.640 0-2.740.900-3.200 1.750h-.050V8.500H9.700V20h3.380v-5.700c0-1.500.280-2.950 2.140-2.950 1.830 0 1.860 1.720 1.860 3.050V20h3.420z" />
                </svg>
              </span>
              LinkedIn
            </a>
          </Magnetic>
          <Magnetic strength={0.3}>
            <a className="social" href={`mailto:${ADDRESS}`} title={ADDRESS}>
              <span className="social-disc">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="M3.500 7.500 12 13l8.500-5.500" />
                </svg>
              </span>
              {c.email}
            </a>
          </Magnetic>
        </div>

        <form className="card form" ref={form} data-reveal="rise" noValidate aria-busy={busy} onSubmit={onSubmit}>
          <span className="beam" aria-hidden="true" />
          {field('name', c.name, 'input', { type: 'text', autoComplete: 'name' })}
          {field('email', c.email, 'input', { type: 'email', autoComplete: 'email', dir: 'ltr' })}
          {field('message', c.message, 'textarea', { rows: 4 })}
          <div className="bot" aria-hidden="true">
            <label>
              {c.botLabel} <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy && <span className="spin" aria-hidden="true" />}
            {busy ? c.sending : c.send}
          </button>
          <p className="form-status" role="status" aria-live="polite">
            {status === 'sent' && c.sent}
            {(status === 'notConnected' || status === 'failed') && (
              <>
                {c[status]} <a href={`mailto:${ADDRESS}`} dir="ltr">{ADDRESS}</a>
              </>
            )}
          </p>
        </form>
      </div>
    </section>
  );
}
