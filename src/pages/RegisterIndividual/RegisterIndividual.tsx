import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, IdCard, Mail, Phone, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Footer } from '@components/layout';
import { Button, FormField, MaskedInput, PasswordInput, TextInput, Toast } from '@components/ui';
import { useAuth } from '@contexts/useAuth';
import { useToast } from '@hooks/useToast';
import { AuthServiceError, authService } from '@services/authService';
import type {
  RegistrationErrors,
  RegistrationField,
  StudentRegistrationValues,
} from '@/types/auth';
import {
  authPath,
  getAuthReturnTo,
  PURCHASE_REDIRECT_KEY,
  STUDENT_HOME,
} from '@utils/authReturnTo';
import {
  REGISTRATION_FIELDS,
  validateRegistrationField,
  validateStudentRegistration,
} from '@utils/studentRegistration';
import styles from './RegisterIndividual.module.css';

const INITIAL_VALUES: StudentRegistrationValues = {
  name: '',
  cpf: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

const FIELDS = [
  {
    name: 'name',
    label: 'Nome completo',
    placeholder: 'João da Silva',
    icon: <User size={18} aria-hidden="true" />,
    autoComplete: 'name',
  },
  { name: 'cpf', label: 'CPF', icon: <IdCard size={18} aria-hidden="true" /> },
  {
    name: 'email',
    label: 'E-mail',
    placeholder: 'user@escapa.com.br',
    icon: <Mail size={18} aria-hidden="true" />,
    autoComplete: 'email',
  },
  {
    name: 'phone',
    label: 'Telefone / WhatsApp',
    placeholder: '(11) 99999-9999',
    icon: <Phone size={18} aria-hidden="true" />,
  },
  { name: 'password', label: 'Senha', placeholder: 'Mínimo 8 caracteres' },
  { name: 'confirmPassword', label: 'Confirmar senha', placeholder: 'Repita a senha' },
] as const;

export const RegisterIndividual = () => {
  const { login } = useAuth();
  const { toast, isOpen, showToast, dismissToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = getAuthReturnTo(location.state, location.search);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [touched, setTouched] = useState<Partial<Record<RegistrationField, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const inputs = useRef<Partial<Record<RegistrationField, HTMLInputElement | null>>>({});
  const request = useRef<AbortController | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const focusAfterSubmit = useRef<RegistrationField>();

  useEffect(() => {
    if (!isSubmitting && focusAfterSubmit.current) {
      inputs.current[focusAfterSubmit.current]?.focus();
      focusAfterSubmit.current = undefined;
    }
  }, [isSubmitting]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  const changeValue = (field: RegistrationField, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    setErrorMessage(undefined);
    setErrors((previous) => ({
      ...previous,
      [field]:
        touched[field] ||
        previous[field] ||
        field === 'email' ||
        (field === 'cpf' && value.length === 11)
          ? validateRegistrationField(field, next)
          : undefined,
      ...(field === 'password' && (touched.confirmPassword || next.confirmPassword)
        ? { confirmPassword: validateRegistrationField('confirmPassword', next) }
        : {}),
    }));
  };

  const focusFirstError = (nextErrors: RegistrationErrors) => {
    const first = REGISTRATION_FIELDS.find((field) => nextErrors[field]);
    if (first !== undefined) inputs.current[first]?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending.current || accountCreated) return;
    const nextErrors = validateStudentRegistration(values);
    setTouched(Object.fromEntries(REGISTRATION_FIELDS.map((field) => [field, true])));
    setErrors(nextErrors);
    setErrorMessage(undefined);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }
    pending.current = true;
    setIsSubmitting(true);
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await authService.registerStudent(
        {
          name: values.name,
          cpf: values.cpf,
          email: values.email,
          phone: values.phone,
          password: values.password,
        },
        controller.signal,
      );
      if (!mounted.current || controller.signal.aborted) return;
      setAccountCreated(true);
      try {
        login(response.token, response.user, response.expiresIn);
      } catch {
        setErrorMessage(
          'Sua conta foi criada, mas não foi possível salvar a sessão neste navegador. Entre na sua conta para continuar.',
        );
        return;
      }
      localStorage.removeItem(PURCHASE_REDIRECT_KEY);
      navigate(returnTo ?? STUDENT_HOME, { replace: true, state: { registrationSuccess: true } });
    } catch (error: unknown) {
      if (!mounted.current || controller.signal.aborted) return;
      if (error instanceof AuthServiceError) {
        setErrors(error.fieldErrors);
        setErrorMessage(error.message);
        focusAfterSubmit.current = REGISTRATION_FIELDS.find((field) => error.fieldErrors[field]);
      } else {
        setErrorMessage(
          'Não foi possível confirmar o cadastro. Verifique sua conexão. Se já enviou seus dados, tente entrar antes de cadastrar novamente.',
        );
        showToast(
          'error',
          'Não foi possível confirmar o cadastro',
          'Verifique sua conexão. Seus dados foram mantidos. Se o cadastro foi concluído, tente entrar na sua conta.',
        );
      }
    } finally {
      pending.current = false;
      if (mounted.current) setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar state="register" />
      <main className={styles.main}>
        <div className={styles.panel}>
          <div className={styles.heading}>
            <Link to={authPath('/cadastro', returnTo)} className={styles.back} aria-label="Voltar">
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
            <h1 className={styles.title} id="register-individual-title">
              Cadastro · Aluno individual
            </h1>
          </div>
          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
            aria-labelledby="register-individual-title"
            aria-busy={isSubmitting}
          >
            {FIELDS.map((field) => {
              const id = `register-${field.name}`;
              const shared = {
                id,
                ref: (input: HTMLInputElement | null) => {
                  inputs.current[field.name] = input;
                },
                value: values[field.name],
                disabled: isSubmitting,
                required: field.name !== 'phone',
                invalid: Boolean(errors[field.name]),
                className: styles.fieldInput,
                'aria-describedby': errors[field.name] ? `${id}-error` : undefined,
                onBlur: () => {
                  setTouched((previous) => ({ ...previous, [field.name]: true }));
                  setErrors((previous) => ({
                    ...previous,
                    [field.name]: validateRegistrationField(field.name, values),
                  }));
                },
              };
              return (
                <FormField
                  key={field.name}
                  label={field.label}
                  htmlFor={id}
                  error={errors[field.name]}
                >
                  {field.name === 'cpf' || field.name === 'phone' ? (
                    <MaskedInput
                      {...shared}
                      mask={field.name}
                      icon={field.icon}
                      placeholder={'placeholder' in field ? field.placeholder : undefined}
                      onValueChange={(value) => changeValue(field.name, value)}
                    />
                  ) : field.name === 'password' || field.name === 'confirmPassword' ? (
                    <PasswordInput
                      {...shared}
                      autoComplete="new-password"
                      placeholder={field.placeholder}
                      onChange={(event) => changeValue(field.name, event.target.value)}
                    />
                  ) : (
                    <TextInput
                      {...shared}
                      type={field.name === 'email' ? 'email' : 'text'}
                      autoComplete={field.autoComplete}
                      placeholder={field.placeholder}
                      icon={field.icon}
                      onChange={(event) => changeValue(field.name, event.target.value)}
                    />
                  )}
                </FormField>
              );
            })}
            {errorMessage && (
              <p className={styles.error} role="alert">
                {errorMessage}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              label={isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
              fullWidth
              isLoading={isSubmitting}
              disabled={accountCreated}
              className={styles.submit}
            />
            <p className={styles.login}>
              <span>
                já tenho conta - <Link to={authPath('/login', returnTo)}>Entrar</Link>
              </span>
            </p>
          </form>
        </div>
      </main>
      <Footer variant="compact" />
      {toast && (
        <Toast
          key={toast.key}
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) dismissToast();
          }}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
        />
      )}
    </div>
  );
};
