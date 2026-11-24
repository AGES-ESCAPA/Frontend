import { describe, expect, it } from 'vitest';
import type { CourseDetail, CourseFormValues } from '@/types/course';
import {
  buildCoursePayload,
  courseDetailToFormValues,
  COURSE_FORM_INITIAL_VALUES,
  hasCourseFormErrors,
  validateCourseForm,
} from './courseForm';

const validPublishValues: CourseFormValues = {
  ...COURSE_FORM_INITIAL_VALUES,
  title: 'Turismo Sustentável',
  shortDescription: 'Resumo curto',
  description: 'Descrição longa',
  category: 'Turismo',
  difficulty: 'INICIANTE',
  durationTime: '120',
  deadline: '30',
  price: '1.500,00',
  teaserVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  thumbnailUrl: 'https://cdn.escapa.com/capa.jpg',
};

describe('validateCourseForm', () => {
  it('exige apenas o título no modo rascunho', () => {
    expect(validateCourseForm(COURSE_FORM_INITIAL_VALUES, 'draft')).toEqual({
      title: 'Preenchimento obrigatório.',
    });
    expect(
      validateCourseForm({ ...COURSE_FORM_INITIAL_VALUES, title: 'Rascunho' }, 'draft'),
    ).toEqual({});
  });

  it('rejeita teaser inválido nos dois modos', () => {
    const values = { ...validPublishValues, teaserVideoUrl: 'https://example.com/video' };
    expect(validateCourseForm(values, 'draft').teaserVideoUrl).toBe(
      'Informe um link válido do YouTube ou Vimeo.',
    );
    expect(validateCourseForm(values, 'publish').teaserVideoUrl).toBe(
      'Informe um link válido do YouTube ou Vimeo.',
    );
  });

  it('aceita URLs do YouTube, YouTube Shorts, youtu.be e Vimeo', () => {
    for (const teaserVideoUrl of [
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://player.vimeo.com/video/123456789',
      'https://vimeo.com/123456789?share=copy',
    ]) {
      expect(
        validateCourseForm({ ...validPublishValues, teaserVideoUrl }, 'publish').teaserVideoUrl,
      ).toBeUndefined();
    }
  });

  it('valida prazo, carga horária e preço com mensagens específicas', () => {
    const base = { ...validPublishValues, title: 'Curso' };

    expect(validateCourseForm({ ...base, deadline: 'abc' }, 'draft').deadline).toBe(
      'Informe um número válido.',
    );
    expect(validateCourseForm({ ...base, deadline: '0' }, 'draft').deadline).toBe(
      'Informe um valor maior que zero.',
    );
    expect(validateCourseForm({ ...base, deadline: '1,5' }, 'draft').deadline).toBe(
      'Informe um número inteiro de dias ou horas.',
    );

    expect(validateCourseForm({ ...base, durationTime: '-1' }, 'draft').durationTime).toBe(
      'Informe um valor maior que zero.',
    );
    expect(validateCourseForm({ ...base, durationTime: '' }, 'publish').durationTime).toBe(
      'Preenchimento obrigatório.',
    );

    expect(validateCourseForm({ ...base, price: '' }, 'draft').price).toBeUndefined();
    expect(validateCourseForm({ ...base, price: '' }, 'publish').price).toBe(
      'Preenchimento obrigatório.',
    );
    expect(validateCourseForm({ ...base, price: 'xyz' }, 'publish').price).toBe(
      'Informe um valor válido.',
    );
    expect(validateCourseForm({ ...base, price: '0' }, 'publish').price).toBe(
      'Informe um preço maior que zero.',
    );
  });

  it('exige todos os campos de vitrine ao publicar', () => {
    const draftOnly = { ...COURSE_FORM_INITIAL_VALUES, title: 'Só título' };
    expect(validateCourseForm(draftOnly, 'publish')).toMatchObject({
      category: 'Selecione uma categoria.',
      difficulty: 'Selecione um nível de dificuldade.',
      shortDescription: 'Preenchimento obrigatório.',
      description: 'Preenchimento obrigatório.',
      durationTime: 'Preenchimento obrigatório.',
      price: 'Preenchimento obrigatório.',
    });
  });
});

describe('hasCourseFormErrors', () => {
  it('ignora entradas undefined', () => {
    expect(hasCourseFormErrors({ title: undefined, price: 'Inválido' })).toBe(true);
    expect(hasCourseFormErrors({})).toBe(false);
  });
});

describe('buildCoursePayload', () => {
  it('converte valores mascarados e limpa campos opcionais', () => {
    const payload = buildCoursePayload(validPublishValues, 'DRAFT', true);

    expect(payload).toMatchObject({
      title: 'Turismo Sustentável',
      category: 'Turismo',
      level: 'INICIANTE',
      featured: true,
      description: 'Descrição longa',
      shortDescription: 'Resumo curto',
      teaserVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationTime: 120,
      deadline: 30,
      price: 1500,
      status: 'DRAFT',
    });
  });

  it('permite rascunho com campos opcionais vazios', () => {
    const payload = buildCoursePayload(
      { ...COURSE_FORM_INITIAL_VALUES, title: '  Rascunho  ' },
      'PUBLISHED',
    );

    expect(payload).toMatchObject({
      title: 'Rascunho',
      category: null,
      level: null,
      description: null,
      shortDescription: null,
      teaserVideoUrl: null,
      durationTime: null,
      deadline: null,
      price: null,
      status: 'PUBLISHED',
      featured: false,
    });
  });
});

describe('courseDetailToFormValues', () => {
  it('mapeia nível acentuado e formata o preço', () => {
    const detail: CourseDetail = {
      id: 'c-1',
      title: 'Curso',
      category: 'Turismo',
      level: 'Intermediário',
      featured: false,
      description: 'Desc',
      shortDescription: 'Curto',
      thumbnailUrl: null,
      teaserVideoUrl: null,
      durationTime: 90,
      deadline: null,
      price: 199.5,
      status: 'DRAFT',
    };

    expect(courseDetailToFormValues(detail)).toMatchObject({
      title: 'Curso',
      difficulty: 'INTERMEDIARIO',
      durationTime: '90',
      deadline: '',
      price: expect.stringMatching(/199/),
    });
  });

  it('deixa preço vazio quando o backend não envia número', () => {
    expect(
      courseDetailToFormValues({
        id: 'c-2',
        title: 'Sem preço',
        category: null,
        level: null,
        featured: false,
        description: null,
        shortDescription: null,
        thumbnailUrl: null,
        teaserVideoUrl: null,
        durationTime: null,
        deadline: null,
        price: null,
        status: 'DRAFT',
      }).price,
    ).toBe('');
  });
});
