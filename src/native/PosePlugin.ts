import { NativeModules } from 'react-native';

const { PosePlugin } = NativeModules;

export type Landmark = {
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export const PoseDetectorModule = {
  async inicializar(): Promise<string> {
    if (!PosePlugin?.inicializar) return 'error';
    return await PosePlugin.inicializar();
  },

  async processarFrame(frameInput: string): Promise<Landmark[]> {
    if (!PosePlugin?.processarFrame) return [];
    return await PosePlugin.processarFrame(frameInput);
  },

  async finalizar(): Promise<string> {
    if (!PosePlugin?.finalizar) return 'error';
    return await PosePlugin.finalizar();
  },
};