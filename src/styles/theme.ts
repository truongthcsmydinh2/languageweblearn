export const colors = {
  // Màu chính - nút gọi hành động
  primary: {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9', // Xanh mint pastel (Nút chính, thanh tiến trình)
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#319795',
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
  },
  
  // Màu phụ - nút thứ cấp, đường dẫn
  secondary: {
    50: '#FAF5FF',
    100: '#E9D8FD',
    200: '#D6BCFA', // Tím lavender pastel (Nút phụ, đường dẫn)
    300: '#B794F4',
    400: '#9F7AEA',
    500: '#805AD5',
    600: '#6B46C1',
    700: '#553C9A',
    800: '#44337A',
    900: '#322659',
  },
  
  // Màu trung tính - màu xám
  gray: {
    50: '#F7FAFC', // Trắng ngà (Văn bản chính)
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0', // Xám nhạt (Văn bản phụ)
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748', // Xám đậm (Khu vực phụ)
    800: '#1A202C', // Xanh đen đậm (Toàn bộ nền trang)
    900: '#171923',
  },
  
  // Màu trạng thái
  success: {
    200: '#9AE6B4', // Xanh lá pastel (Thành công)
    600: '#38A169',
  },
  warning: {
    200: '#FAF089', // Vàng pastel (Cảnh báo)
    600: '#D69E2E',
  },
  error: {
    200: '#FEB2B2', // Đỏ cam pastel (Lỗi)
    600: '#E53E3E',
  },
  info: {
    200: '#FBB6CE', // Hồng san hô pastel (Thông tin)
    600: '#D53F8C',
  },
  
  // Màu nền và text
  background: {
    main: '#1A202C', // Xanh đen đậm (Toàn bộ nền trang)
    surface: '#2D3748', // Xám đậm (Khu vực phụ)
    card: '#2D3748', // Xám đậm (Cards)
    light: '#F7FAFC', // Trắng ngà
    dark: '#1A202C', // Xanh đen đậm
  },
  text: {
    primary: '#F7FAFC', // Trắng ngà (Văn bản chính)
    secondary: '#A0AEC0', // Xám nhạt (Văn bản phụ)
    disabled: '#718096',
    inverse: '#1A202C', // Xanh đen đậm (Text trên nút)
  }
};

// Thiết lập spacing, border radius và shadow
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
};

export const radius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Typography
export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "'Merriweather', 'Times New Roman', serif",
    mono: "'Fira Code', Consolas, Monaco, monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
}; 