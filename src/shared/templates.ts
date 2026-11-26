import type { HomeType, RecurrenceType } from './types';

export interface HomeWizardInput {
  homeType: HomeType;
  bedroomCount: number;
  bathroomCount: number;
  hasKitchen: boolean;
  hasYard: boolean;
  hasPets: boolean;
}

export interface StarterAreaTemplate {
  tempKey: string;
  name: string;
  categoryKey: string;
  iconKey: string;
  defaultXp: number;
}

export interface StarterTaskTemplate {
  areaTempKey: string | null;
  title: string;
  categoryKey: string;
  xp: number;
  recurrenceType: RecurrenceType;
  cooldownDays: number | null;
}

export interface StarterFortPlan {
  areas: StarterAreaTemplate[];
  tasks: StarterTaskTemplate[];
}

export function generateStarterPlan(input: HomeWizardInput): StarterFortPlan {
  const areas: StarterAreaTemplate[] = [];
  const tasks: StarterTaskTemplate[] = [];

  if (input.hasKitchen) {
    areas.push({
      tempKey: 'kitchen',
      name: 'Kitchen',
      categoryKey: 'kitchen',
      iconKey: 'utensils',
      defaultXp: 15,
    });
    tasks.push(
      {
        areaTempKey: 'kitchen',
        title: 'Load or unload dishwasher',
        categoryKey: 'dishes',
        xp: 15,
        recurrenceType: 'daily',
        cooldownDays: null,
      },
      {
        areaTempKey: 'kitchen',
        title: 'Wipe kitchen counters & stove',
        categoryKey: 'counter_wipe',
        xp: 10,
        recurrenceType: 'daily',
        cooldownDays: null,
      },
      {
        areaTempKey: 'kitchen',
        title: 'Sweep kitchen floor',
        categoryKey: 'floor_sweep',
        xp: 15,
        recurrenceType: 'cooldown',
        cooldownDays: 3,
      }
    );
  }

  areas.push({
    tempKey: 'living_room',
    name: input.homeType === 'studio' ? 'Main Living Area' : 'Living Room',
    categoryKey: 'living_room',
    iconKey: 'sofa',
    defaultXp: 10,
  });
  tasks.push(
    {
      areaTempKey: 'living_room',
      title: 'Pick up clutter & straighten cushions',
      categoryKey: 'tidy_room',
      xp: 10,
      recurrenceType: 'daily',
      cooldownDays: null,
    },
    {
      areaTempKey: 'living_room',
      title: 'Vacuum or sweep living area',
      categoryKey: 'vacuum',
      xp: 20,
      recurrenceType: 'cooldown',
      cooldownDays: 4,
    }
  );

  if (input.bathroomCount > 0) {
    areas.push({
      tempKey: 'bathroom',
      name: input.bathroomCount > 1 ? 'Bathrooms' : 'Bathroom',
      categoryKey: 'bathroom',
      iconKey: 'droplet',
      defaultXp: 20,
    });
    tasks.push(
      {
        areaTempKey: 'bathroom',
        title: 'Wipe sink & mirror',
        categoryKey: 'sink_mirror',
        xp: 15,
        recurrenceType: 'cooldown',
        cooldownDays: 3,
      },
      {
        areaTempKey: 'bathroom',
        title: 'Scrub toilet & empty bath bin',
        categoryKey: 'toilet_scrub',
        xp: 25,
        recurrenceType: 'weekly',
        cooldownDays: null,
      }
    );
  }

  if (input.bedroomCount > 0 && input.homeType !== 'studio') {
    areas.push({
      tempKey: 'bedrooms',
      name: input.bedroomCount > 1 ? 'Bedrooms' : 'Bedroom',
      categoryKey: 'bedroom',
      iconKey: 'bed',
      defaultXp: 10,
    });
    tasks.push(
      {
        areaTempKey: 'bedrooms',
        title: 'Make bed & put clothes in hamper',
        categoryKey: 'make_bed',
        xp: 10,
        recurrenceType: 'daily',
        cooldownDays: null,
      },
      {
        areaTempKey: 'bedrooms',
        title: 'Put away folded laundry',
        categoryKey: 'laundry',
        xp: 15,
        recurrenceType: 'cooldown',
        cooldownDays: 4,
      }
    );
  }

  if (input.hasYard) {
    areas.push({
      tempKey: 'yard',
      name: 'Yard & Patio',
      categoryKey: 'yard',
      iconKey: 'trees',
      defaultXp: 25,
    });
    tasks.push({
      areaTempKey: 'yard',
      title: 'Water plants or sweep patio',
      categoryKey: 'yard_care',
      xp: 20,
      recurrenceType: 'cooldown',
      cooldownDays: 3,
    });
  }

  // Area-less general Fort missions
  tasks.push({
    areaTempKey: null,
    title: 'Take out the garbage & recycling',
    categoryKey: 'trash',
    xp: 15,
    recurrenceType: 'cooldown',
    cooldownDays: 2,
  });

  if (input.hasPets) {
    tasks.push({
      areaTempKey: null,
      title: 'Feed pets & refresh water bowl',
      categoryKey: 'pet_care',
      xp: 10,
      recurrenceType: 'daily',
      cooldownDays: null,
    });
  }

  return { areas, tasks };
}
