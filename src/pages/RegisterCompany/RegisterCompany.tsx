import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IdCard, Landmark, Mail, Phone, User } from 'lucide-react';
import { Footer, Navbar } from '@components/layout';
import { Button, FormField, MaskedInput, PasswordInput, TextInput, Toast } from '@components/ui';
import { useAuth } from '@contexts/useAuth';
import { useToast } from '@hooks/useToast';
import { AuthServiceError, DuplicateRegistrationError, authService } from '@services/authService';
import {
  COMPANY_REGISTRATION_INITIAL_VALUES,
  buildCompanyRegistrationPayload,
  hasCompanyRegistrationErrors,
  validateCompanyRegistration,
} from '@utils/companyRegistration';
import type {
  CompanyRegistrationErrors,
  CompanyRegistrationField,
  CompanyRegistrationValues,
} from '@/types/auth';
import styles from './RegisterCompany.module.css';

const COMPANY_PANEL_ROUTE = '/empresa/colaboradores';

const FIELD_ICON_SIZE = 20;

const DUPLICATE_MESSAGES = {
  cnpj: 'Este CNPJ já está cadastrado.',
  email: 'Este e-mail já está cadastrado.',
} as const;

/**
 * Cadastro de Empresa — Pessoa Jurídica
 */
export const RegisterCompany = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [values, setValues] = useState<CompanyRegistrationValues>(
    COMPANY_REGISTRATION_INITIAL_VALUES,
  );
  const [errors, setErrors] = useState<CompanyRegistrationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, isOpen, showToast, dismissToast } = useToast();

  const changeField = (field: CompanyRegistrationField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] === undefined ? current : { ...current, [field]: undefined },
    );
  };

  const submitRegistration = async () => {
    const validationErrors = validateCompanyRegistration(values);
    setErrors(validationErrors);
    setFormError(null);

    if (hasCompanyRegistrationErrors(validationErrors)) return;

    setIsSubmitting(true);

    try {
      const session = await authService.registerCompany(buildCompanyRegistrationPayload(values));
      login(session.token, session.user);
      navigate(COMPANY_PANEL_ROUTE, { replace: true });
    } catch (error: unknown) {
      if (error instanceof DuplicateRegistrationError && error.field !== null) {
        setErrors({ [error.field]: DUPLICATE_MESSAGES[error.field] });
      } else if (error instanceof AuthServiceError && error.status === 400) {
        setFormError(error.message);
      } else if (error instanceof AuthServiceError) {
        setFormError('Não foi possível concluir o cadastro. Tente novamente.');
      } else {
        showToast(
          'error',
          'Falha de conexão',
          'Não foi possível concluir o cadastro. Verifique sua internet e tente novamente.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    void submitRegistration();
  };

  return (
    <div className={styles.page}>
      <Navbar state="register" />

      <main className={styles.main}>
        <h1 className={styles.title}>Cadastro · Empresa</h1>

        <form className={styles.card} onSubmit={handleSubmit} noValidate>
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Dados do responsável</legend>

            <FormField
              label="Nome do responsável"
              htmlFor="company-responsible-name"
              error={errors.responsibleName}
            >
              <TextInput
                id="company-responsible-name"
                icon={<User size={FIELD_ICON_SIZE} />}
                placeholder="Maria Oliveira"
                autoComplete="name"
                value={values.responsibleName}
                onChange={(event) => changeField('responsibleName', event.target.value)}
                invalid={errors.responsibleName !== undefined}
                required
              />
            </FormField>
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Dados da empresa</legend>

            <FormField label="CNPJ" htmlFor="company-cnpj" error={errors.cnpj}>
              <MaskedInput
                id="company-cnpj"
                mask="cnpj"
                icon={<IdCard size={FIELD_ICON_SIZE} />}
                placeholder="00.000.000/0001-00"
                value={values.cnpj}
                onValueChange={(value) => changeField('cnpj', value)}
                invalid={errors.cnpj !== undefined}
                required
              />
            </FormField>

            <FormField
              label="Razão social / Nome fantasia"
              htmlFor="company-name"
              error={errors.companyName}
            >
              <TextInput
                id="company-name"
                icon={<Landmark size={FIELD_ICON_SIZE} />}
                placeholder="Empresa Ltda."
                autoComplete="organization"
                value={values.companyName}
                onChange={(event) => changeField('companyName', event.target.value)}
                invalid={errors.companyName !== undefined}
                required
              />
            </FormField>

            <FormField label="E-mail corporativo" htmlFor="company-email" error={errors.email}>
              <TextInput
                id="company-email"
                type="email"
                icon={<Mail size={FIELD_ICON_SIZE} />}
                placeholder="contato@empresa.com.br"
                autoComplete="email"
                value={values.email}
                onChange={(event) => changeField('email', event.target.value)}
                invalid={errors.email !== undefined}
                required
              />
            </FormField>

            <FormField label="Telefone corporativo" htmlFor="company-phone" error={errors.phone}>
              <MaskedInput
                id="company-phone"
                mask="phone"
                icon={<Phone size={FIELD_ICON_SIZE} />}
                placeholder="(11) 3000-0000"
                value={values.phone}
                onValueChange={(value) => changeField('phone', value)}
                invalid={errors.phone !== undefined}
              />
            </FormField>
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Segurança</legend>

            <FormField label="Senha" htmlFor="company-password" error={errors.password}>
              <PasswordInput
                id="company-password"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                value={values.password}
                onChange={(event) => changeField('password', event.target.value)}
                invalid={errors.password !== undefined}
                required
              />
            </FormField>

            <FormField
              label="Confirmar senha"
              htmlFor="company-password-confirmation"
              error={errors.passwordConfirmation}
            >
              <PasswordInput
                id="company-password-confirmation"
                placeholder="Repita a senha"
                autoComplete="new-password"
                value={values.passwordConfirmation}
                onChange={(event) => changeField('passwordConfirmation', event.target.value)}
                invalid={errors.passwordConfirmation !== undefined}
                required
              />
            </FormField>
          </fieldset>

          {formError ? (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            label="Cadastrar"
            fullWidth
            isLoading={isSubmitting}
          />

          <p className={styles.loginPrompt}>
            <span>já tenho conta -</span>
            <Link to="/login" className={styles.loginLink}>
              Entrar
            </Link>
          </p>
        </form>
      </main>

      <Footer variant="compact" />

      {toast ? (
        <Toast
          open={isOpen}
          onOpenChange={dismissToast}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
        />
      ) : null}
    </div>
  );
};
