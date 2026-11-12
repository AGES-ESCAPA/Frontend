import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Mail, User } from 'lucide-react';
import { isValidEmail } from '@utils/validators';
import { Button } from '../Button';
import { FormField } from '../FormField';
import { Modal } from '../Modal';
import { SelectInput } from '../SelectInput';
import type { SelectInputOption } from '../SelectInput';
import { TextInput } from '../TextInput';
import styles from './EmployeeFormModal.module.css';

export type EmployeeAccessStatus = 'pending' | 'active' | 'inactive';
export type EmployeeFormField = 'name' | 'email' | 'role' | 'accessStatus';

export interface EmployeeFormValues {
  name: string;
  email: string;
  role: string;
  accessStatus?: EmployeeAccessStatus;
}

export interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialValues?: Partial<EmployeeFormValues> | null;
  fieldErrors?: Partial<Record<EmployeeFormField, string>>;
  isSubmitting?: boolean;
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>;
}

interface EmployeeFormState {
  name: string;
  email: string;
  role: string;
  accessStatus: EmployeeAccessStatus;
}

type EmployeeFormErrors = Partial<Record<EmployeeFormField, string>>;

const EMPTY_FORM: EmployeeFormState = {
  name: '',
  email: '',
  role: '',
  accessStatus: 'pending',
};

const STATUS_OPTIONS: readonly SelectInputOption[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
];

const PENDING_STATUS_OPTIONS: readonly SelectInputOption[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'inactive', label: 'Inativo' },
];

const GENERIC_SUBMIT_ERROR = 'Não foi possível salvar o colaborador. Tente novamente.';
const NO_FIELD_ERRORS: Partial<Record<EmployeeFormField, string>> = {};

const createFormState = (
  initialValues?: Partial<EmployeeFormValues> | null,
): EmployeeFormState => ({
  ...EMPTY_FORM,
  name: initialValues?.name ?? '',
  email: initialValues?.email ?? '',
  role: initialValues?.role ?? '',
  accessStatus: initialValues?.accessStatus ?? 'active',
});

const isEmployeeAccessStatus = (value: string): value is EmployeeAccessStatus =>
  value === 'pending' || value === 'active' || value === 'inactive';

const validateForm = (form: EmployeeFormState): EmployeeFormErrors => {
  const errors: EmployeeFormErrors = {};

  if (!form.name.trim()) errors.name = 'Informe o nome completo.';
  if (!form.role.trim()) errors.role = 'Informe o cargo.';
  if (!form.email.trim()) {
    errors.email = 'Informe o e-mail corporativo.';
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Informe um e-mail válido.';
  }

  return errors;
};

export const EmployeeFormModal = ({
  open,
  onOpenChange,
  mode,
  initialValues,
  fieldErrors = NO_FIELD_ERRORS,
  isSubmitting = false,
  onSubmit,
}: EmployeeFormModalProps) => {
  const [form, setForm] = useState<EmployeeFormState>(() => createFormState(initialValues));
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dismissedFieldErrors, setDismissedFieldErrors] = useState<Set<EmployeeFormField>>(
    () => new Set(),
  );
  const baseId = useId();
  const initialValuesRef = useRef(initialValues);

  useEffect(() => {
    initialValuesRef.current = initialValues;
  });

  useEffect(() => {
    if (!open) return;

    setForm(createFormState(initialValuesRef.current));
    setErrors({});
    setWasSubmitted(false);
    setSubmitError(null);
    setDismissedFieldErrors(new Set());
  }, [
    open,
    mode,
    initialValues?.name,
    initialValues?.email,
    initialValues?.role,
    initialValues?.accessStatus,
  ]);

  useEffect(() => {
    setDismissedFieldErrors(new Set());
  }, [fieldErrors]);

  useEffect(() => {
    if (submitError && Object.values(fieldErrors).includes(submitError)) {
      setSubmitError(null);
    }
  }, [fieldErrors, submitError]);

  useEffect(() => {
    if (wasSubmitted) setErrors(validateForm(form));
  }, [form, wasSubmitted]);

  const isPendingEmployee = mode === 'edit' && initialValues?.accessStatus === 'pending';
  const statusOptions = isPendingEmployee ? PENDING_STATUS_OPTIONS : STATUS_OPTIONS;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setWasSubmitted(true);
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setSubmitError(null);
    if (Object.keys(validationErrors).length > 0) return;

    const values: EmployeeFormValues = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role.trim(),
      ...(mode === 'edit' ? { accessStatus: form.accessStatus } : {}),
    };

    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : GENERIC_SUBMIT_ERROR);
    }
  };

  const getFieldError = (field: EmployeeFormField) =>
    errors[field] ?? (dismissedFieldErrors.has(field) ? undefined : fieldErrors[field]);
  const dismissFieldError = (field: EmployeeFormField) => {
    setDismissedFieldErrors((current) => new Set(current).add(field));
  };
  const nameId = `${baseId}-name`;
  const emailId = `${baseId}-email`;
  const roleId = `${baseId}-role`;
  const accessStatusId = `${baseId}-access-status`;

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Cadastrar Colaborador' : 'Editar Colaborador'}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button
            type="button"
            label="Cancelar"
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          />
          <Button type="submit" label="Salvar" variant="primary" isLoading={isSubmitting} />
        </>
      }
    >
      <div className={styles.fields}>
        <FormField label="Nome completo" htmlFor={nameId} required error={getFieldError('name')}>
          <TextInput
            id={nameId}
            name="name"
            autoComplete="name"
            placeholder="Nome completo"
            value={form.name}
            onChange={(event) => {
              dismissFieldError('name');
              setForm((current) => ({ ...current, name: event.target.value }));
            }}
            icon={<User size={18} aria-hidden="true" />}
            required
            disabled={isSubmitting}
            invalid={Boolean(getFieldError('name'))}
            aria-describedby={getFieldError('name') ? `${nameId}-error` : undefined}
          />
        </FormField>

        <FormField
          label="E-mail corporativo"
          htmlFor={emailId}
          required
          error={getFieldError('email')}
        >
          <TextInput
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="usuario@empresa.com.br"
            value={form.email}
            onChange={(event) => {
              dismissFieldError('email');
              setForm((current) => ({ ...current, email: event.target.value }));
            }}
            icon={<Mail size={18} aria-hidden="true" />}
            required
            disabled={isSubmitting}
            invalid={Boolean(getFieldError('email'))}
            aria-describedby={getFieldError('email') ? `${emailId}-error` : undefined}
          />
        </FormField>

        <FormField label="Cargo" htmlFor={roleId} required error={getFieldError('role')}>
          <TextInput
            id={roleId}
            name="role"
            autoComplete="organization-title"
            placeholder="Cargo do colaborador"
            value={form.role}
            onChange={(event) => {
              dismissFieldError('role');
              setForm((current) => ({ ...current, role: event.target.value }));
            }}
            required
            disabled={isSubmitting}
            invalid={Boolean(getFieldError('role'))}
            aria-describedby={getFieldError('role') ? `${roleId}-error` : undefined}
          />
        </FormField>

        {mode === 'edit' ? (
          <FormField
            className={styles.accessStatus}
            label="Status do acesso"
            htmlFor={accessStatusId}
            required
            error={getFieldError('accessStatus')}
          >
            <SelectInput
              id={accessStatusId}
              name="accessStatus"
              options={statusOptions}
              value={form.accessStatus}
              onChange={(event) => {
                const value = event.target.value;
                if (!isEmployeeAccessStatus(value)) return;
                dismissFieldError('accessStatus');
                setForm((current) => ({ ...current, accessStatus: value }));
              }}
              disabled={isSubmitting}
              invalid={Boolean(getFieldError('accessStatus'))}
              aria-describedby={
                getFieldError('accessStatus') ? `${accessStatusId}-error` : undefined
              }
            />
          </FormField>
        ) : null}
      </div>

      {submitError ? (
        <p className={styles.submitError} role="alert">
          {submitError}
        </p>
      ) : null}
    </Modal>
  );
};
