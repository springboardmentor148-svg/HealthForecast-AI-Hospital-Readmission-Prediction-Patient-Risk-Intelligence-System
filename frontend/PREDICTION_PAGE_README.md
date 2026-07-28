# HealthForecastAI - Prediction Page Implementation

## Overview
A comprehensive professional prediction form for the HealthForecastAI hospital readmission prediction system. The page is fully responsive, production-ready, and maintains consistency with the blue/white/gray healthcare theme.

## Architecture

### Pages
- **PredictionPage** (`src/pages/PredictionPage.jsx`)
  - Main container for the prediction experience
  - Handles form submission, loading state, and result display
  - Includes informational sidebar with usage instructions

### Form Components
- **PredictionForm** (`src/components/PredictionForm.jsx`)
  - Collects all 37 model input fields
  - Organized into 5 logical sections
  - Client-side validation for required fields and numeric ranges
  - Supports form reset

### Reusable Field Components (`src/components/form/`)
- **TextInput.jsx** - Text input fields (e.g., diagnosis codes)
- **NumberInput.jsx** - Numeric input fields with min/max validation
- **SelectInput.jsx** - Dropdown selectors with formatted option labels
- **CheckboxInput.jsx** - Checkbox inputs for medications
- **FormSection.jsx** - Semantic section wrapper for form grouping

### UI Components
- **LoadingSpinner** (`src/components/LoadingSpinner.jsx`)
  - Full-screen overlay spinner with messaging
  - Smooth fade-in animation
  - Shows during prediction processing

- **ResultPanel** (`src/components/ResultPanel.jsx`)
  - Displays prediction results with risk score
  - Color-coded risk levels (High: red, Medium: orange, Low: green)
  - Includes clinical disclaimer
  - Option to generate new prediction

### Data
- **categoryOptions.js** (`src/data/categoryOptions.js`)
  - All 28 categorical fields with their unique values from training data
  - Extracted from `train_data.csv` for accuracy

## Form Structure

### 1. Patient Information (4 fields)
- Race (categorical, 5 options)
- Gender (categorical, 3 options)
- Age (numeric, 0-120)
- Number of Diagnoses (numeric, 1-15) *

### 2. Admission Details (4 fields)
- Admission Type (categorical, 8 options)
- Admission Source (categorical, 17 options)
- Time in Hospital (numeric, 1-365 days)
- Discharge Disposition (categorical, 26 options)

### 3. Hospital Information (2 fields)
- Medical Specialty (categorical, 72 options)
- Payer Code (categorical, 17 options)

### 4. Procedures & Laboratory (6 fields)
- Lab Procedures (numeric, 0+)
- Procedures (numeric, 0+)
- Medications (numeric, 0+)
- Outpatient Visits Prior (numeric, 0+)
- Emergency Visits Prior (numeric, 0+)
- Inpatient Visits Prior (numeric, 0+)

### 5. Diagnosis (3 fields)
- Primary Diagnosis ICD-9 (text input)
- Secondary Diagnosis ICD-9 (text input)
- Tertiary Diagnosis ICD-9 (text input)

### 6. Medications (18 fields)
- 16 individual medication checkboxes
- Medication Change During Visit (categorical, 2 options)
- Diabetes Medication During Visit (categorical, 2 options)

**Total: 37 input fields matching XGBoost model requirements**

## Features

### Validation
- ✓ Required field validation
- ✓ Numeric range validation (age, time in hospital, etc.)
- ✓ Real-time error clearing on field edit
- ✓ Form-wide validation before submission
- ✓ Accessible error messages with ARIA attributes

### User Experience
- ✓ Responsive design (desktop, tablet, mobile)
- ✓ Clear visual feedback (loading spinner, error banners)
- ✓ Smooth animations and transitions
- ✓ Sticky sidebar on desktop
- ✓ Three-column form grid (responsive)
- ✓ Medication grid layout

### Styling
- ✓ Consistent blue/white/gray theme
- ✓ Glass-morphism cards with backdrop blur
- ✓ Smooth color gradients for buttons
- ✓ Accessible contrast ratios
- ✓ Mobile-first responsive breakpoints

### Navigation
- ✓ Hash-based routing (#prediction, #home)
- ✓ Seamless page transitions
- ✓ "Start Prediction" button on home page
- ✓ Return to home links in results

## File Structure

```
frontend/src/
├── pages/
│   └── PredictionPage.jsx          # Main prediction page container
├── components/
│   ├── PredictionForm.jsx          # Form with 37 fields
│   ├── LoadingSpinner.jsx          # Loading state UI
│   ├── ResultPanel.jsx             # Result display component
│   └── form/
│       ├── TextInput.jsx           # Text input field
│       ├── NumberInput.jsx         # Number input field
│       ├── SelectInput.jsx         # Dropdown selector
│       ├── CheckboxInput.jsx       # Checkbox field
│       └── FormSection.jsx         # Form section wrapper
├── data/
│   └── categoryOptions.js          # Categorical field options
├── styles/
│   └── prediction.css              # Prediction page styling
└── App.jsx                         # Updated with hash routing
```

## Mock Prediction Behavior

Currently, the frontend generates a mock prediction with:
- Random risk score (0-100%)
- Risk level classification (Low: 0-40%, Medium: 40-70%, High: 70-100%)
- Risk-appropriate messaging
- Timestamp of prediction

**To connect to the backend**, update the `handleSubmit` function in `PredictionPage.jsx`:

```javascript
const response = await fetch('/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
})
const result = await response.json()
```

## Accessibility
- Semantic HTML (fieldset, legend, label)
- ARIA attributes (aria-invalid, aria-describedby)
- Proper heading hierarchy
- Focus management
- Error announcements
- Mobile-friendly touch targets

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance
- Code-split pages
- Lazy component loading
- CSS optimized with production build
- Smooth animations at 60fps
- No external dependencies beyond React

## Next Steps for Backend Integration
1. Implement API endpoint in Flask backend
2. Update the `handleSubmit` in PredictionPage.jsx
3. Add error handling for API failures
4. Implement retry logic for failed predictions
5. Add loading states per field group (optional)
6. Implement result caching (optional)
