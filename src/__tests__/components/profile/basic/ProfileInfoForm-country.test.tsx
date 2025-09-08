import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileInfoForm } from '@/components/profile/basic/ProfileInfoForm';

// Mock the geographic data
vi.mock('@/lib/geographic-data', () => ({
  NORTH_AMERICAN_COUNTRIES: [
    { value: 'United States', label: 'United States', code: 'US' },
    { value: 'Canada', label: 'Canada', code: 'CA' },
    { value: 'Mexico', label: 'Mexico', code: 'MX' },
    { value: 'Other', label: 'Other North American Country', code: 'OTHER' },
  ],
  getStatesProvincesByCountry: vi.fn((country: string) => {
    if (country === 'United States') {
      return [
        {
          value: 'California',
          label: 'California',
          code: 'CA',
          country: 'United States',
        },
        {
          value: 'Texas',
          label: 'Texas',
          code: 'TX',
          country: 'United States',
        },
        {
          value: 'New York',
          label: 'New York',
          code: 'NY',
          country: 'United States',
        },
      ];
    }
    if (country === 'Canada') {
      return [
        { value: 'Ontario', label: 'Ontario', code: 'ON', country: 'Canada' },
        { value: 'Quebec', label: 'Quebec', code: 'QC', country: 'Canada' },
        {
          value: 'British Columbia',
          label: 'British Columbia',
          code: 'BC',
          country: 'Canada',
        },
      ];
    }
    if (country === 'Mexico') {
      return [
        { value: 'Jalisco', label: 'Jalisco', code: 'JA', country: 'Mexico' },
        { value: 'Mexico', label: 'Mexico', code: 'MX', country: 'Mexico' },
        {
          value: 'Nuevo Leon',
          label: 'Nuevo Leon',
          code: 'NL',
          country: 'Mexico',
        },
      ];
    }
    return [];
  }),
  getCitiesByStateProvince: vi.fn((stateProvince: string) => {
    if (stateProvince === 'California') {
      return ['Los Angeles', 'San Francisco', 'San Diego'];
    }
    if (stateProvince === 'Ontario') {
      return ['Toronto', 'Ottawa', 'Hamilton'];
    }
    return [];
  }),
}));

describe('ProfileInfoForm - Country Fields', () => {
  const defaultProps = {
    fullName: 'John Doe',
    onFullNameChange: vi.fn(),
    username: 'johndoe',
    onUsernameChange: vi.fn(),
    usernameAvailable: true,
    usernameChecking: false,
    currentUsername: null,
    country: '',
    onCountryChange: vi.fn(),
    stateProvince: '',
    onStateProvinceChange: vi.fn(),
    city: '',
    onCityChange: vi.fn(),
    region: '',
    onRegionChange: vi.fn(),
    language: 'en',
    onLanguageChange: vi.fn(),
    units: 'metric',
    onUnitsChange: vi.fn(),
    timePerMeal: 2,
    onTimePerMealChange: vi.fn(),
    skillLevel: '2',
    onSkillLevelChange: vi.fn(),
    onSubmit: vi.fn(),
    submitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Country Field Rendering', () => {
    it('should render country dropdown', () => {
      render(<ProfileInfoForm {...defaultProps} />);

      expect(screen.getByText('Country')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Select a country')).toBeInTheDocument();
    });

    it('should show all North American countries in dropdown', () => {
      render(<ProfileInfoForm {...defaultProps} />);

      const countrySelect = screen.getByDisplayValue('Select a country');
      fireEvent.click(countrySelect);

      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('Canada')).toBeInTheDocument();
      expect(screen.getByText('Mexico')).toBeInTheDocument();
      expect(
        screen.getByText('Other North American Country')
      ).toBeInTheDocument();
    });

    it('should display selected country', () => {
      render(<ProfileInfoForm {...defaultProps} country="United States" />);

      const countrySelect = screen.getByDisplayValue('United States');
      expect(countrySelect).toHaveValue('United States');
    });
  });

  describe('State/Province Field Rendering', () => {
    it('should not show state/province field when no country is selected', () => {
      render(<ProfileInfoForm {...defaultProps} country="" />);

      expect(screen.queryByText('State')).not.toBeInTheDocument();
      expect(screen.queryByText('Province/Territory')).not.toBeInTheDocument();
    });

    it('should show state field for United States', () => {
      render(<ProfileInfoForm {...defaultProps} country="United States" />);

      expect(screen.getByText('State')).toBeInTheDocument();
      const stateSelect = screen.getByRole('combobox', { name: /state/i });
      expect(stateSelect).toBeInTheDocument();
    });

    it('should show province/territory field for Canada', () => {
      render(<ProfileInfoForm {...defaultProps} country="Canada" />);

      expect(screen.getByText('Province/Territory')).toBeInTheDocument();
      const provinceSelect = screen.getByRole('combobox', {
        name: /province/i,
      });
      expect(provinceSelect).toBeInTheDocument();
    });

    it('should show state field for Mexico', () => {
      render(<ProfileInfoForm {...defaultProps} country="Mexico" />);

      expect(screen.getByText('State')).toBeInTheDocument();
      const stateSelect = screen.getByRole('combobox', { name: /state/i });
      expect(stateSelect).toBeInTheDocument();
    });

    it('should display US states when United States is selected', () => {
      render(<ProfileInfoForm {...defaultProps} country="United States" />);

      const stateSelect = screen.getByRole('combobox', { name: /state/i });
      fireEvent.click(stateSelect);

      expect(screen.getByText('California')).toBeInTheDocument();
      expect(screen.getByText('Texas')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
    });

    it('should display Canadian provinces when Canada is selected', () => {
      render(<ProfileInfoForm {...defaultProps} country="Canada" />);

      const provinceSelect = screen.getByRole('combobox', {
        name: /province/i,
      });
      fireEvent.click(provinceSelect);

      expect(screen.getByText('Ontario')).toBeInTheDocument();
      expect(screen.getByText('Quebec')).toBeInTheDocument();
      expect(screen.getByText('British Columbia')).toBeInTheDocument();
    });
  });

  describe('City Field Rendering', () => {
    it('should not show city field when no state/province is selected', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          country="United States"
          stateProvince=""
        />
      );

      expect(screen.queryByText('City')).not.toBeInTheDocument();
    });

    it('should show city field when state/province is selected', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          country="United States"
          stateProvince="California"
        />
      );

      expect(screen.getByText('City')).toBeInTheDocument();
      const citySelect = screen.getByRole('combobox', { name: /city/i });
      expect(citySelect).toBeInTheDocument();
    });

    it('should display cities for selected state/province', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          country="United States"
          stateProvince="California"
        />
      );

      const citySelect = screen.getByRole('combobox', { name: /city/i });
      fireEvent.click(citySelect);

      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
      expect(screen.getByText('San Diego')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onCountryChange when country is selected', () => {
      const onCountryChange = vi.fn();
      render(
        <ProfileInfoForm {...defaultProps} onCountryChange={onCountryChange} />
      );

      const countrySelect = screen.getByDisplayValue('Select a country');
      fireEvent.change(countrySelect, { target: { value: 'United States' } });

      expect(onCountryChange).toHaveBeenCalledWith('United States');
    });

    it('should call onStateProvinceChange when state/province is selected', () => {
      const onStateProvinceChange = vi.fn();
      render(
        <ProfileInfoForm
          {...defaultProps}
          country="United States"
          onStateProvinceChange={onStateProvinceChange}
        />
      );

      const stateSelect = screen.getByDisplayValue('Select state');
      fireEvent.change(stateSelect, { target: { value: 'California' } });

      expect(onStateProvinceChange).toHaveBeenCalledWith('California');
    });

    it('should call onCityChange when city is selected', () => {
      const onCityChange = vi.fn();
      render(
        <ProfileInfoForm
          {...defaultProps}
          country="United States"
          stateProvince="California"
          onCityChange={onCityChange}
        />
      );

      const citySelect = screen.getByDisplayValue('Select a city');
      fireEvent.change(citySelect, { target: { value: 'San Francisco' } });

      expect(onCityChange).toHaveBeenCalledWith('San Francisco');
    });
  });

  describe('Cascading Behavior', () => {
    it('should call onCountryChange when country changes', () => {
      const onCountryChange = vi.fn();
      render(
        <ProfileInfoForm
          {...defaultProps}
          country="United States"
          stateProvince="California"
          onCountryChange={onCountryChange}
        />
      );

      const countrySelect = screen.getByDisplayValue('United States');
      fireEvent.change(countrySelect, { target: { value: 'Canada' } });

      // Country change should be called
      expect(onCountryChange).toHaveBeenCalledWith('Canada');
    });

    it('should call onStateProvinceChange when state/province changes', () => {
      const onStateProvinceChange = vi.fn();
      render(
        <ProfileInfoForm
          {...defaultProps}
          country="United States"
          stateProvince="California"
          city="San Francisco"
          onStateProvinceChange={onStateProvinceChange}
        />
      );

      const stateSelect = screen.getByDisplayValue('California');
      fireEvent.change(stateSelect, { target: { value: 'Texas' } });

      // State/province change should be called
      expect(onStateProvinceChange).toHaveBeenCalledWith('Texas');
    });
  });

  describe('Form Submission', () => {
    it('should include country data in form submission', async () => {
      const onSubmit = vi.fn();
      render(
        <ProfileInfoForm
          {...defaultProps}
          country="United States"
          stateProvince="California"
          city="San Francisco"
          onSubmit={onSubmit}
        />
      );

      const form = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(form);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for country fields', () => {
      render(<ProfileInfoForm {...defaultProps} />);

      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('should have proper labels for state/province fields', () => {
      render(<ProfileInfoForm {...defaultProps} country="United States" />);

      expect(screen.getByText('State')).toBeInTheDocument();
    });

    it('should have proper labels for city fields', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          country="United States"
          stateProvince="California"
        />
      );

      expect(screen.getByText('City')).toBeInTheDocument();
    });

    it('should have helpful descriptions for geographic fields', () => {
      render(<ProfileInfoForm {...defaultProps} />);

      expect(
        screen.getByText(
          /Select your country for localized recipe recommendations/i
        )
      ).toBeInTheDocument();
    });
  });
});
