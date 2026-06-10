import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AutomationToolbar from './AutomationToolbar';
import ConfirmDialog from './ConfirmDialog';
import EditorDrawer from './EditorDrawer';
import StatusBadge from './StatusBadge';

describe('automation shared ui', () => {
  it('renders search, filters and create action in the toolbar', async () => {
    const onSearch = vi.fn();
    const onCreate = vi.fn();
    render(
      <AutomationToolbar
        createLabel="Tạo block"
        filters={<button type="button">Archived</button>}
        onCreate={onCreate}
        onSearchChange={onSearch}
        searchPlaceholder="Tìm block"
      />,
    );

    await userEvent.type(screen.getByPlaceholderText('Tìm block'), 'hello');
    await userEvent.click(screen.getByRole('button', { name: 'Tạo block' }));

    expect(onSearch).toHaveBeenLastCalledWith('hello');
    expect(onCreate).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Archived' })).toBeInTheDocument();
  });

  it('renders status badges and drawer content', () => {
    render(
      <>
        <StatusBadge tone="success">Đang bật</StatusBadge>
        <EditorDrawer open title="Sửa trigger" onClose={() => undefined}>
          <button type="button">Lưu</button>
        </EditorDrawer>
      </>,
    );

    expect(screen.getByText('Đang bật')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sửa trigger' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeInTheDocument();
  });

  it('confirms destructive actions', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog description="Xóa dữ liệu này?" onCancel={() => undefined} onConfirm={onConfirm} open title="Xác nhận xóa" />);

    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    expect(onConfirm).toHaveBeenCalled();
  });
});
