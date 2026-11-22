import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Mail, User } from 'lucide-react';
import { isValidEmail } from '@utils/validators';
import type { EmployeeCourseAssignment } from '@services/companyEmployeeService';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { FilterTabs } from '../FilterTabs';
import { FormField } from '../FormField';
import { Modal } from '../Modal';
import { SelectInput } from '../SelectInput';
import type { SelectInputOption } from '../SelectInput';
import { TextInput } from '../TextInput';
import styles from './EmployeeFormModal.module.css';

export type EmployeeAccessStatus = 'pending' | 'active' | 'inactive';
export type EmployeeFormField = 'name' | 'email' | 'role' | 'accessStatus';
export type EmployeeFormTab = 'Dados' | 'Cursos liberados';

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
  /** Cursos da empresa com flag de liberação (só no modo edição). */
  courses?: EmployeeCourseAssignment[];
  coursesLoading?: boolean;
  coursesError?: string | null;
  courseToggleId?: string | null;
  onToggleCourse?: (courseId: string, assigned: boolean) => void | Promise<void>;
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

const FIXED_PENDING_STATUS_OPTIONS: readonly SelectInputOption[] = [
  { value: 'pending', label: 'Pendente' },
];

const EDIT_TABS: EmployeeFormTab[] = ['Dados', 'Cursos liberados'];
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

const validateForm = (
  form: EmployeeFormState,
  mode: EmployeeFormModalProps['mode'],
): EmployeeFormErrors => {
  const errors: EmployeeFormErrors = {};

  if (!form.name.trim()) errors.name = 'Informe o nome completo.';
  if (mode === 'edit' && !form.role.trim()) errors.role = 'Informe o cargo.';
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
  courses = [],
  coursesLoading = false,
  coursesError = null,
  courseToggleId = null,
  onToggleCourse,
}: EmployeeFormModalProps) => {
  const [form, setForm] = useState<EmployeeFormState>(() => createFormState(initialValues));
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EmployeeFormTab>('Dados');
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
    setActiveTab('Dados');
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
    if (wasSubmitted) setErrors(validateForm(form, mode));
  }, [form, mode, wasSubmitted]);

  const isPendingEmployee = mode === 'edit' && initialValues?.accessStatus === 'pending';
  const statusOptions = isPendingEmployee ? PENDING_STATUS_OPTIONS : STATUS_OPTIONS;
  const showCoursesTab = mode === 'edit';
  const isBusy = isSubmitting || courseToggleId != null;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;

    if (showCoursesTab && activeTab === 'Cursos liberados') {
      onOpenChange(false);
      return;
    }

    setWasSubmitted(true);
    const validationErrors = validateForm(form, mode);
    setErrors(validationErrors);
    setSubmitError(null);
    if (Object.keys(validationErrors).length > 0) {
      setActiveTab('Dados');
      return;
    }

    const values: EmployeeFormValues = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: mode === 'edit' ? form.role.trim() : '',
      ...(mode === 'edit' ? { accessStatus: form.accessStatus } : {}),
    };

    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      setActiveTab('Dados');
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
      size={showCoursesTab ? 'lg' : 'md'}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button
            type="button"
            label="Cancelar"
            variant="secondary"
            disabled={isBusy}
            onClick={() => handleOpenChange(false)}
          />
          <Button
            type="submit"
            label={'Salvar'}
            variant="primary"
            isLoading={isSubmitting}
            disabled={courseToggleId != null}
          />
        </>
      }
    >
      {showCoursesTab ? (
        <div className={styles.tabs}>
          <FilterTabs
            options={EDIT_TABS}
            selected={activeTab}
            onChange={(value) => setActiveTab(value as EmployeeFormTab)}
            groupLabel="Seções do colaborador"
          />
        </div>
      ) : null}

      {activeTab === 'Dados' ? (
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
              disabled={isBusy}
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
              disabled={isBusy}
              invalid={Boolean(getFieldError('email'))}
              aria-describedby={getFieldError('email') ? `${emailId}-error` : undefined}
            />
          </FormField>

          {mode === 'edit' ? (
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
                disabled={isBusy}
                invalid={Boolean(getFieldError('role'))}
                aria-describedby={getFieldError('role') ? `${roleId}-error` : undefined}
              />
            </FormField>
          ) : null}

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
              options={mode === 'create' ? FIXED_PENDING_STATUS_OPTIONS : statusOptions}
              value={mode === 'create' ? 'pending' : form.accessStatus}
              onChange={(event) => {
                const value = event.target.value;
                if (!isEmployeeAccessStatus(value)) return;
                dismissFieldError('accessStatus');
                setForm((current) => ({ ...current, accessStatus: value }));
              }}
              disabled={mode === 'create' || isBusy}
              invalid={Boolean(getFieldError('accessStatus'))}
              aria-describedby={
                getFieldError('accessStatus') ? `${accessStatusId}-error` : undefined
              }
            />
          </FormField>
        </div>
      ) : (
        <div className={styles.courses}>
          <p className={styles.coursesHint}>
            Marque os cursos da empresa que este colaborador pode acessar. Ao cadastrar um
            colaborador, todos os cursos da empresa são liberados por padrão.
          </p>
          {coursesLoading ? (
            <p className={styles.coursesStatus} role="status">
              Carregando cursos...
            </p>
          ) : null}
          {coursesError ? (
            <p className={styles.coursesError} role="alert">
              {coursesError}
            </p>
          ) : null}
          {!coursesLoading && !coursesError && courses.length === 0 ? (
            <p className={styles.coursesStatus}>
              A empresa ainda não possui cursos adquiridos para liberar.
            </p>
          ) : null}
          {!coursesLoading && courses.length > 0 ? (
            <ul className={styles.courseList}>
              {courses.map((course) => (
                <li key={course.courseId}>
                  <Checkbox
                    label={course.title}
                    hint={course.category ?? undefined}
                    checked={course.assigned}
                    disabled={isBusy}
                    onChange={() => {
                      void onToggleCourse?.(course.courseId, !course.assigned);
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {submitError ? (
        <p className={styles.submitError} role="alert">
          {submitError}
        </p>
      ) : null}
    </Modal>
  );
};
