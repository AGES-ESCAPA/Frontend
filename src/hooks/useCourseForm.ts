import { useCallback, useReducer } from 'react';
import type { CourseFormErrors, CourseFormField, CourseFormValues } from '@/types/course';
import { COURSE_FORM_INITIAL_VALUES } from '@utils/courseForm';

interface CourseFormState {
  values: CourseFormValues;
  errors: CourseFormErrors;
}

type CourseFormAction =
  | { type: 'changeField'; field: CourseFormField; value: string }
  | { type: 'replaceValues'; values: CourseFormValues }
  | { type: 'replaceErrors'; errors: CourseFormErrors };

const INITIAL_STATE: CourseFormState = {
  values: COURSE_FORM_INITIAL_VALUES,
  errors: {},
};

const courseFormReducer = (state: CourseFormState, action: CourseFormAction): CourseFormState => {
  switch (action.type) {
    case 'changeField': {
      if (state.values[action.field] === action.value) return state;

      const { [action.field]: fieldError, ...remainingErrors } = state.errors;

      return {
        values: { ...state.values, [action.field]: action.value },
        errors: fieldError === undefined ? state.errors : remainingErrors,
      };
    }
    case 'replaceValues':
      return { values: action.values, errors: {} };
    case 'replaceErrors':
      return { ...state, errors: action.errors };
  }
};

/**
 * Estado do formulário do Construtor de Curso.
 *
 * Usa `useReducer` de propósito: `dispatch` tem identidade estável, então os
 * callbacks devolvidos aqui nunca mudam de referência e os cards memoizados só
 * re-renderizam quando o próprio valor ou erro deles muda.
 */
export const useCourseForm = () => {
  const [state, dispatch] = useReducer(courseFormReducer, INITIAL_STATE);

  const changeField = useCallback((field: CourseFormField, value: string) => {
    dispatch({ type: 'changeField', field, value });
  }, []);

  const replaceValues = useCallback((values: CourseFormValues) => {
    dispatch({ type: 'replaceValues', values });
  }, []);

  const replaceErrors = useCallback((errors: CourseFormErrors) => {
    dispatch({ type: 'replaceErrors', errors });
  }, []);

  return {
    values: state.values,
    errors: state.errors,
    changeField,
    replaceValues,
    replaceErrors,
  };
};
