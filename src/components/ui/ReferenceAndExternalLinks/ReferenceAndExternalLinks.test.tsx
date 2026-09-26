import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LessonReferences, type LessonReference } from './ReferenceAndExternalLinks';

const references: LessonReference[] = [
  {
    title: 'Ministério do Turismo - Guia do viajante',
    url: 'https://www.gov.br/turismo/pt-br',
    favicon: 'https://www.gov.br/turismo/favicon.ico',
  },
  {
    title: 'Visit Brasil - Roteiros oficiais',
    url: 'https://visitbrasil.com/roteiros',
    // sem favicon
  },
  {
    title: 'ICMBio - Parques Nacionais',
    url: 'https://www.gov.br/icmbio/pt-br',
    favicon: 'https://www.gov.br/icmbio/favicon.ico',
  },
];

describe('LessonReferences', () => {
  describe('populated list', () => {
    it('should render the section title and one card per reference', () => {
      render(<LessonReferences references={references} />);

      expect(
        screen.getByRole('heading', { name: 'Referências e links externos' }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(references.length);
    });

    it('should show title, icon and external link indicator in each card', () => {
      render(<LessonReferences references={references} />);

      references.forEach((reference) => {
        const link = screen.getByRole('link', { name: reference.title });

        expect(within(link).getByText(reference.title)).toBeInTheDocument();
        expect(within(link).getByTestId('reference-external-icon')).toBeInTheDocument();
      });
    });

    it('should open each link in a new tab safely', () => {
      render(<LessonReferences references={references} />);

      references.forEach((reference) => {
        const link = screen.getByRole('link', { name: reference.title });

        expect(link).toHaveAttribute('href', reference.url);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should render the favicon image when provided', () => {
      const { container } = render(<LessonReferences references={[references[0]]} />);

      const img = container.querySelector('img');

      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', references[0].favicon);
      expect(screen.queryByTestId('reference-fallback-icon')).not.toBeInTheDocument();
    });
  });

  describe('missing or broken favicon', () => {
    it('should show the generic icon when there is no favicon', () => {
      const { container } = render(<LessonReferences references={[references[1]]} />);

      expect(container.querySelector('img')).not.toBeInTheDocument();
      expect(screen.getByTestId('reference-fallback-icon')).toBeInTheDocument();
    });

    it('should swap to the generic icon when the favicon fails to load', () => {
      const { container } = render(<LessonReferences references={[references[0]]} />);

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();

      fireEvent.error(img!);

      expect(container.querySelector('img')).not.toBeInTheDocument();
      expect(screen.getByTestId('reference-fallback-icon')).toBeInTheDocument();
    });

    it('should only replace the icon of the card whose favicon failed', () => {
      const { container } = render(
        <LessonReferences references={[references[0], references[2]]} />,
      );

      const [firstImg] = Array.from(container.querySelectorAll('img'));
      fireEvent.error(firstImg);

      expect(container.querySelectorAll('img')).toHaveLength(1);
      expect(screen.getAllByTestId('reference-fallback-icon')).toHaveLength(1);
    });

    it('should keep the card title and link working after the favicon fails', () => {
      const { container } = render(<LessonReferences references={[references[0]]} />);

      fireEvent.error(container.querySelector('img')!);

      const link = screen.getByRole('link', { name: references[0].title });
      expect(link).toHaveAttribute('href', references[0].url);
    });
  });

  describe('empty state', () => {
    it('should render nothing when the list is empty', () => {
      const { container } = render(<LessonReferences references={[]} />);

      expect(container).toBeEmptyDOMElement();
      expect(
        screen.queryByRole('heading', { name: 'Referências e links externos' }),
      ).not.toBeInTheDocument();
    });
  });
});
