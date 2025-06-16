import { renderHook, act } from '@testing-library/react';
import useToastNotification from '../useToastNotification';
import { toast } from '@/components/ui/use-toast';

// Mock the imported toast function
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

describe('useToastNotification Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should call toast with success variant', () => {
    const { result } = renderHook(() => useToastNotification());
    
    // Mock toast return value for chaining
    (toast as jest.Mock).mockReturnValue({ id: 'toast-id' });
    
    act(() => {
      result.current.showSuccess('Success message');
    });
    
    expect(toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Success message',
      variant: 'success',
    });
  });
  
  it('should call toast with error variant', () => {
    const { result } = renderHook(() => useToastNotification());
    
    act(() => {
      result.current.showError('Error message');
    });
    
    expect(toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Error message',
      variant: 'destructive',
    });
  });
  
  it('should call toast with info variant', () => {
    const { result } = renderHook(() => useToastNotification());
    
    act(() => {
      result.current.showInfo('Info message');
    });
    
    expect(toast).toHaveBeenCalledWith({
      title: 'Information',
      description: 'Info message',
      variant: 'default',
    });
  });
  
  it('should call toast with warning variant', () => {
    const { result } = renderHook(() => useToastNotification());
    
    act(() => {
      result.current.showWarning('Warning message');
    });
    
    expect(toast).toHaveBeenCalledWith({
      title: 'Warning',
      description: 'Warning message',
      variant: 'warning',
    });
  });
  
  it('should call toast with loading variant', () => {
    const { result } = renderHook(() => useToastNotification());
    
    // Mock toast return value
    (toast as jest.Mock).mockReturnValue({ id: 'toast-id' });
    
    let toastId;
    
    act(() => {
      toastId = result.current.showLoading('Loading message');
    });
    
    expect(toast).toHaveBeenCalledWith({
      title: 'Loading',
      description: 'Loading message',
      variant: 'loading',
      duration: Infinity, // Loading toasts should stay until dismissed
    });
    
    // Should return the toast id for later dismissal
    expect(toastId).toEqual({ id: 'toast-id' });
  });
  
  it('should call toast.dismiss with the toast id', () => {
    const { result } = renderHook(() => useToastNotification());
    
    // Setup mock dismiss function
    const mockDismiss = jest.fn();
    toast.dismiss = mockDismiss;
    
    act(() => {
      result.current.dismiss('toast-id');
    });
    
    expect(mockDismiss).toHaveBeenCalledWith('toast-id');
  });
  
  it('should allow custom titles', () => {
    const { result } = renderHook(() => useToastNotification());
    
    act(() => {
      result.current.showSuccess('Success message', 'Custom Title');
    });
    
    expect(toast).toHaveBeenCalledWith({
      title: 'Custom Title',
      description: 'Success message',
      variant: 'success',
    });
  });
  
  it('should handle custom toast options', () => {
    const { result } = renderHook(() => useToastNotification());
    
    const customOptions = {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: jest.fn(),
      },
    };
    
    act(() => {
      result.current.showSuccess('Success message', 'Success', customOptions);
    });
    
    expect(toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Success message',
      variant: 'success',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: expect.any(Function),
      },
    });
  });

  it('should chain multiple toasts correctly', () => {
    const { result } = renderHook(() => useToastNotification());
    
    act(() => {
      result.current.showSuccess('First message');
      result.current.showError('Second message');
      result.current.showInfo('Third message');
    });
    
    // Check toast was called 3 times
    expect(toast).toHaveBeenCalledTimes(3);
    
    // Check the order and content of the calls
    expect(toast).toHaveBeenNthCalledWith(1, {
      title: 'Success',
      description: 'First message',
      variant: 'success',
    });
    
    expect(toast).toHaveBeenNthCalledWith(2, {
      title: 'Error',
      description: 'Second message',
      variant: 'destructive',
    });
    
    expect(toast).toHaveBeenNthCalledWith(3, {
      title: 'Information',
      description: 'Third message',
      variant: 'default',
    });
  });
}); 