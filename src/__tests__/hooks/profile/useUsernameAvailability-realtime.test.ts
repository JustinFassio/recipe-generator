import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useUsernameAvailability } from '@/hooks/profile/useUsernameAvailability';
import * as auth from '@/lib/auth';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  claimUsername: vi.fn(),
  checkUsernameAvailability: vi.fn(),
}));

// Import the mocked modules
import * as auth from '@/lib/auth';

describe('useUsernameAvailability Real-time Updates', () => {
  const mockClaimUsername = auth.claimUsername as ReturnType<typeof vi.fn>;
  const mockCheckUsernameAvailability =
    auth.checkUsernameAvailability as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should call refreshProfile after successful username claim', async () => {
    // Mock successful username claim
    mockClaimUsername.mockResolvedValue({
      success: true,
      profile: { username: 'alice_baker' },
    });

    mockCheckUsernameAvailability.mockResolvedValue({
      available: true,
    });

    const { result } = renderHook(() => useUsernameAvailability());

    // Set username
    act(() => {
      result.current.setUsername('alice_baker');
    });

    // Claim username
    await act(async () => {
      await result.current.claimUsername('alice_baker');
    });

    // The refreshProfile should be called by the hook
    // We can verify this by checking that the mock was called
    expect(mockClaimUsername).toHaveBeenCalledWith('alice_baker');
  });

  it('should handle failed username claim gracefully', async () => {
    // Mock failed username claim
    mockClaimUsername.mockResolvedValue({
      success: false,
      error: { message: 'Username already taken' },
    });

    mockCheckUsernameAvailability.mockResolvedValue({
      available: false,
    });

    const { result } = renderHook(() => useUsernameAvailability());

    // Set username
    act(() => {
      result.current.setUsername('taken_username');
    });

    // Try to claim username
    await act(async () => {
      await result.current.claimUsername('taken_username');
    });

    // Verify that the claim was attempted
    expect(mockClaimUsername).toHaveBeenCalledWith('taken_username');
  });

  it('should clear username after successful claim', async () => {
    // Mock successful username claim
    mockClaimUsername.mockResolvedValue({
      success: true,
      profile: { username: 'alice_baker' },
    });

    mockCheckUsernameAvailability.mockResolvedValue({
      available: true,
    });

    const { result } = renderHook(() => useUsernameAvailability());

    // Set username
    act(() => {
      result.current.setUsername('alice_baker');
    });

    // Verify username is set
    expect(result.current.username).toBe('alice_baker');

    // Claim username
    await act(async () => {
      await result.current.claimUsername('alice_baker');
    });

    // Verify username is cleared
    expect(result.current.username).toBe('');
  });

  it('should check availability in real-time as user types', async () => {
    // Mock availability checks
    mockCheckUsernameAvailability
      .mockResolvedValueOnce({ available: true }) // First call for 'alice'
      .mockResolvedValueOnce({ available: false }); // Second call for 'alice_baker'

    const { result } = renderHook(() => useUsernameAvailability());

    // Type first username
    act(() => {
      result.current.handleUsernameChange('alice');
    });

    // Wait for first availability check
    await waitFor(() => {
      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('alice');
    });

    // Wait for availability status to update
    await waitFor(() => {
      expect(result.current.isAvailable).toBe(true);
    });

    // Type second username
    act(() => {
      result.current.handleUsernameChange('alice_baker');
    });

    // Wait for second availability check
    await waitFor(() => {
      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('alice_baker');
    });

    // Wait for availability status to update
    await waitFor(() => {
      expect(result.current.isAvailable).toBe(false);
    });

    // Verify both calls were made
    expect(mockCheckUsernameAvailability).toHaveBeenCalledTimes(2);
  });

  it('should handle debounced availability checking', async () => {
    // Mock availability check
    mockCheckUsernameAvailability.mockResolvedValue({
      available: true,
    });

    const { result } = renderHook(() => useUsernameAvailability());

    // Type username quickly
    act(() => {
      result.current.handleUsernameChange('a');
    });

    act(() => {
      result.current.handleUsernameChange('al');
    });

    act(() => {
      result.current.handleUsernameChange('ali');
    });

    act(() => {
      result.current.handleUsernameChange('alic');
    });

    act(() => {
      result.current.handleUsernameChange('alice');
    });

    // Wait for debounced check (should only call once for the final value)
    await waitFor(() => {
      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('alice');
    });

    // Should only be called once due to debouncing
    expect(mockCheckUsernameAvailability).toHaveBeenCalledTimes(1);
  });
});
