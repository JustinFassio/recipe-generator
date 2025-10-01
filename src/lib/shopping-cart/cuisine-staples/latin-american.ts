import { CuisineStaplesData } from './types';
import { mexican } from './latin-american/mexican';
import { brazilian } from './latin-american/brazilian';
import { peruvian } from './latin-american/peruvian';
import { argentinian } from './latin-american/argentinian';
import { chilean } from './latin-american/chilean';
import { colombian } from './latin-american/colombian';
import { venezuelan } from './latin-american/venezuelan';
import { uruguayan } from './latin-american/uruguayan';
import { paraguayan } from './latin-american/paraguayan';
import { bolivian } from './latin-american/bolivian';
import { ecuadorian } from './latin-american/ecuadorian';

export const latinAmericanCuisines: Record<string, CuisineStaplesData> = {
  mexican,
  brazilian,
  peruvian,
  argentinian,
  chilean,
  colombian,
  venezuelan,
  uruguayan,
  paraguayan,
  bolivian,
  ecuadorian,
};
