import {createContext, useContext} from 'react';
import {layoutFor} from './layout';
export const LayoutContext = createContext(layoutFor());
export const useEpisodeLayout = () => useContext(LayoutContext);
