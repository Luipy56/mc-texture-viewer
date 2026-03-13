import {
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  type Scene,
} from 'three';

const SUN_RADIUS = 20;

export class LightingManager {
  readonly ambientLight: AmbientLight;
  readonly directionalLight: DirectionalLight;
  readonly hemisphereLight: HemisphereLight;

  private _sunAzimuthDeg = 30;
  private _sunElevationDeg = 50;
  private _sunIntensity = 1.4;
  private _sunColor = 0xfff0e0;
  private _hemisphereEnabled = false;

  constructor(scene: Scene) {
    this.ambientLight = new AmbientLight(0xfff5eb, 0.35);
    scene.add(this.ambientLight);

    this.directionalLight = new DirectionalLight(this._sunColor, this._sunIntensity);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -15;
    this.directionalLight.shadow.camera.right = 15;
    this.directionalLight.shadow.camera.top = 15;
    this.directionalLight.shadow.camera.bottom = -15;
    this.updateSunPosition();
    scene.add(this.directionalLight);

    this.hemisphereLight = new HemisphereLight(0x87ceeb, 0x404040, 0.4);
    this.hemisphereLight.visible = false;
    scene.add(this.hemisphereLight);
  }

  private updateSunPosition(): void {
    const az = (this._sunAzimuthDeg * Math.PI) / 180;
    const el = (this._sunElevationDeg * Math.PI) / 180;
    const r = SUN_RADIUS;
    this.directionalLight.position.set(
      r * Math.cos(el) * Math.sin(az),
      r * Math.sin(el),
      r * Math.cos(el) * Math.cos(az)
    );
  }

  set sunEnabled(value: boolean) {
    this.directionalLight.visible = value;
  }

  get sunEnabled(): boolean {
    return this.directionalLight.visible;
  }

  setSunDirection(azimuthDeg: number, elevationDeg: number): void {
    this._sunAzimuthDeg = azimuthDeg;
    this._sunElevationDeg = Math.max(-90, Math.min(90, elevationDeg));
    this.updateSunPosition();
  }

  getSunDirection(): { azimuthDeg: number; elevationDeg: number } {
    return { azimuthDeg: this._sunAzimuthDeg, elevationDeg: this._sunElevationDeg };
  }

  setSunIntensity(value: number): void {
    this._sunIntensity = Math.max(0, Math.min(5, value));
    this.directionalLight.intensity = this._sunIntensity;
  }

  getSunIntensity(): number {
    return this._sunIntensity;
  }

  setSunColor(hex: number): void {
    this._sunColor = hex;
    this.directionalLight.color.setHex(hex);
  }

  getSunColor(): number {
    return this._sunColor;
  }

  set hemisphereEnabled(value: boolean) {
    this._hemisphereEnabled = value;
    this.hemisphereLight.visible = value;
  }

  get hemisphereEnabled(): boolean {
    return this._hemisphereEnabled;
  }
}
