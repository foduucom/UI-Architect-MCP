import { BUTTON_COMPONENTS } from '../components/buttons/index.js';
import { CARD_COMPONENTS } from '../components/cards/index.js';
import { INPUT_COMPONENTS } from '../components/inputs/index.js';
import { CHECKBOX_COMPONENTS } from '../components/checkboxes/index.js';
import { RADIO_BUTTONS_COMPONENTS } from '../components/radio-buttons/index.js';
import { TOGGLE_SWITCHES_COMPONENTS } from '../components/toggle-switches/index.js';
import { TOOLTIPS_COMPONENTS } from '../components/tooltips/index.js';
import { LOADERS_COMPONENTS } from '../components/loaders/index.js';
import { FORMS_COMPONENTS } from '../components/forms/index.js';
import { NOTIFICATIONS_COMPONENTS } from '../components/notifications/index.js';
import { PATTERNS_COMPONENTS } from '../components/patterns/index.js';
import type { ComponentDefinition } from './types.js';

/**
 * Local Component Library
 * Aggregates all components defined in the src/components/ folder.
 * This file is now updated with the massive 3800+ component library.
 */
export const LOCAL_COMPONENTS: ComponentDefinition[] = [
  ...BUTTON_COMPONENTS,
  ...CARD_COMPONENTS,
  ...INPUT_COMPONENTS,
  ...CHECKBOX_COMPONENTS,
  ...RADIO_BUTTONS_COMPONENTS,
  ...TOGGLE_SWITCHES_COMPONENTS,
  ...TOOLTIPS_COMPONENTS,
  ...LOADERS_COMPONENTS,
  ...FORMS_COMPONENTS,
  ...NOTIFICATIONS_COMPONENTS,
  ...PATTERNS_COMPONENTS
] as ComponentDefinition[];

export function getAllLocalComponents(): ComponentDefinition[] {
  return LOCAL_COMPONENTS;
}

export function getLocalComponentById(id: string): ComponentDefinition | undefined {
  return LOCAL_COMPONENTS.find(c => c.id === id);
}

export function getLocalComponentsByCategory(category: string): ComponentDefinition[] {
  return LOCAL_COMPONENTS.filter(c => c.category === category);
}
