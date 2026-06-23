import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal.jsx';
import { labels } from '../../utils/labels.js';

describe('Modal', () => {
  it('does not add an extra cancel button when custom actions are provided in children', () => {
    render(
      <Modal title="Konfirmasi hapus" onClose={vi.fn()}>
        <button type="button">{labels.cancel}</button>
        <button type="button">{labels.yesDelete}</button>
      </Modal>,
    );

    expect(screen.getAllByText(labels.cancel)).toHaveLength(1);
    expect(screen.getByText(labels.yesDelete)).toBeInTheDocument();
  });
});
