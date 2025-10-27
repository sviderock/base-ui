import { clientOnly } from '@solidjs/start';
import type { JSX } from 'solid-js';
import { createContext, createSignal, onMount, useContext, type Accessor } from 'solid-js';

export interface DemoVariantSelectorContext {
  selectedVariant: Accessor<string>;
  setSelectedVariant: (variant: string) => void;
  selectedLanguage: Accessor<string>;
  setSelectedLanguage: (language: string) => void;
}

export const DemoVariantSelectorContext = createContext<DemoVariantSelectorContext | null>(null);

export const useDemoVariantSelectorContext = () => {
  const context = useContext(DemoVariantSelectorContext);
  if (!context) {
    throw new Error('Missing DemoVariantSelectorContext');
  }

  return context;
};

interface DemoVariantSelectorProviderProps {
  children: JSX.Element;
  defaultVariant: string;
  defaultLanguage: string;
}

const VARIANT_STORAGE_KEY = 'preferredDemoVariant';
const LANGUAGE_STORAGE_KEY = 'preferredDemoLanguage';

export const DemoVariantSelectorProvider = clientOnly(
  async () => ({ default: _DemoVariantSelectorProvider }),
  { lazy: true },
);

function _DemoVariantSelectorProvider(props: DemoVariantSelectorProviderProps) {
  const [selectedVariant, setSelectedVariant] = createSignal(props.defaultVariant);
  const [selectedLanguage, setSelectedLanguage] = createSignal(props.defaultLanguage);

  const handleSelectedVariantChange = (value: string) => {
    setSelectedVariant(value);
    localStorage.setItem(VARIANT_STORAGE_KEY, value);
  };

  const handleSelectedLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  };

  onMount(() => {
    const variantPreference = localStorage.getItem(VARIANT_STORAGE_KEY);
    const languagePreference = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (variantPreference) {
      setSelectedVariant(variantPreference);
    }

    if (languagePreference) {
      setSelectedLanguage(languagePreference);
    }
  });

  const contextValue = {
    selectedVariant,
    setSelectedVariant: handleSelectedVariantChange,
    selectedLanguage,
    setSelectedLanguage: handleSelectedLanguageChange,
  };

  return (
    <DemoVariantSelectorContext.Provider value={contextValue}>
      {props.children}
    </DemoVariantSelectorContext.Provider>
  );
}
