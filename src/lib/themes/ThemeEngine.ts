/**
 * ThemeEngine.ts
 * Motor de temas que convierte JSON → CSS Variables → DOM
 */

export interface ThemeDefinition {
  $schema: string;
  id: string;
  name: string;
  author: string;
  extends?: string;
  
  tokens: {
    colors: {
      brand: { [key: string]: string };
      neutral: { [key: string]: string };
      text: { [key: string]: string };
      semantic: { [key: string]: string };
    };
    typography: {
      families: { [key: string]: string };
      sizes: { [key: string]: string };
      weights: { [key: string]: number };
      lineHeights: { [key: string]: number };
    };
    spacing: {
      scale: number[];
      containerMaxWidth: string;
    };
    effects: {
      radius: { [key: string]: string };
      shadow: { [key: string]: string };
      blur: { [key: string]: string };
    };
  };
  
  components: {
    [component: string]: {
      [variant: string]: { [prop: string]: any };
    };
  };
  
  layouts: {
    [layout: string]: { [prop: string]: any };
  };
}

interface CSSVariableMap {
  [key: string]: string;
}

export class ThemeEngine {
  private theme: ThemeDefinition;
  private baseTheme?: ThemeDefinition;
  
  constructor(theme: ThemeDefinition, baseTheme?: ThemeDefinition) {
    this.theme = theme;
    this.baseTheme = baseTheme;
  }
  
  /**
   * Combina tema actual con tema base (si existe herencia)
   */
  private getMergedTheme(): ThemeDefinition {
    if (!this.baseTheme || !this.theme.extends) {
      return this.theme;
    }
    
    return this.deepMerge(this.baseTheme, this.theme);
  }
  
  /**
   * Deep merge de objetos
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }
  
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
  
  /**
   * Resuelve path como "brand.primary" → valor
   */
  private resolveToken(path: string): string {
    const parts = path.split('.');
    let value: any = this.getMergedTheme().tokens;
    
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) {
        console.warn(`[ThemeEngine] Token not found: ${path}`);
        return path;
      }
    }
    
    return typeof value === 'number' ? value.toString() : value;
  }
  
  /**
   * Resuelve referencias en strings como "1px solid {neutral.border}"
   */
  private resolveReferences(value: string): string {
    return value.replace(/\{([^}]+)\}/g, (_, token) => {
      return this.resolveToken(token);
    });
  }
  
  /**
   * Genera CSS Variables desde tokens
   */
  generateCSSVariables(): CSSVariableMap {
    const vars: CSSVariableMap = {};
    const theme = this.getMergedTheme();
    
    // === COLORES ===
    this.flattenObject(theme.tokens.colors, 'color', vars);
    
    // === TIPOGRAFÍA ===
    Object.entries(theme.tokens.typography.families).forEach(([key, value]) => {
      vars[`--font-${key}`] = value;
    });
    
    Object.entries(theme.tokens.typography.sizes).forEach(([key, value]) => {
      vars[`--text-${key}`] = value;
    });
    
    Object.entries(theme.tokens.typography.weights).forEach(([key, value]) => {
      vars[`--font-weight-${key}`] = value.toString();
    });
    
    Object.entries(theme.tokens.typography.lineHeights).forEach(([key, value]) => {
      vars[`--leading-${key}`] = value.toString();
    });
    
    // === SPACING ===
    theme.tokens.spacing.scale.forEach((value, index) => {
      vars[`--space-${index}`] = `${value}px`;
    });
    vars['--container-max'] = theme.tokens.spacing.containerMaxWidth;
    
    // === EFECTOS ===
    this.flattenObject(theme.tokens.effects.radius, 'radius', vars);
    this.flattenObject(theme.tokens.effects.shadow, 'shadow', vars);
    this.flattenObject(theme.tokens.effects.blur, 'blur', vars);
    
    // === LAYOUTS ===
    Object.entries(theme.layouts).forEach(([layoutName, layoutProps]) => {
      Object.entries(layoutProps).forEach(([prop, value]) => {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Para objetos como { mobile: 2, tablet: 3, desktop: 4 }
          Object.entries(value).forEach(([breakpoint, val]) => {
            vars[`--layout-${layoutName}-${prop}-${breakpoint}`] = String(val);
          });
        } else {
          vars[`--layout-${layoutName}-${prop}`] = String(value);
        }
      });
    });
    
    return vars;
  }
  
  /**
   * Aplana objetos anidados en CSS variables
   * Ej: { brand: { primary: "#0066FF" } } → --color-brand-primary: #0066FF
   */
  private flattenObject(
    obj: any,
    prefix: string,
    result: CSSVariableMap,
    path: string[] = []
  ): void {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = [...path, key];
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        this.flattenObject(value, prefix, result, newPath);
      } else {
        const varName = `--${prefix}-${newPath.join('-')}`;
        result[varName] = String(value);
      }
    });
  }
  
  /**
   * Genera CSS para componentes
   */
  generateComponentCSS(): string {
    const theme = this.getMergedTheme();
    let css = '';
    
    Object.entries(theme.components).forEach(([component, variants]) => {
      Object.entries(variants).forEach(([variant, styles]) => {
        const className = `.${component}-${variant}`;
        const resolvedStyles = this.resolveComponentStyles(styles);
        
        css += `${className} {\n`;
        Object.entries(resolvedStyles).forEach(([prop, value]) => {
          css += `  ${this.camelToKebab(prop)}: ${value};\n`;
        });
        css += `}\n\n`;
      });
    });
    
    return css;
  }
  
  /**
   * Resuelve estilos de componentes, convirtiendo tokens en CSS vars
   */
  private resolveComponentStyles(styles: any): Record<string, string> {
    const resolved: Record<string, string> = {};
    
    Object.entries(styles).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Detectar si es un token path (brand.primary, spacing.5, etc)
        if (this.isTokenPath(value)) {
          const tokenValue = this.resolveToken(value);
          resolved[key] = tokenValue;
        } 
        // Resolver referencias inline como "1px solid {neutral.border}"
        else if (value.includes('{')) {
          resolved[key] = this.resolveReferences(value);
        } 
        else {
          resolved[key] = value;
        }
      } else {
        resolved[key] = String(value);
      }
    });
    
    return resolved;
  }
  
  /**
   * Detecta si un string es un path de token
   */
  private isTokenPath(value: string): boolean {
    // Token paths: "brand.primary", "spacing.5", "effects.radius.lg"
    const tokenPattern = /^[a-z]+\.[a-z0-9]+(\.[a-z0-9]+)?$/i;
    return tokenPattern.test(value);
  }
  
  /**
   * Convierte camelCase a kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  /**
   * Aplica el tema al DOM
   */
  applyTheme(): void {
    console.log(`[ThemeEngine] Applying theme: ${this.theme.name}`);
    
    const root = document.documentElement;
    const cssVars = this.generateCSSVariables();
    
    // Aplicar variables CSS
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Inyectar CSS de componentes
    const componentCSS = this.generateComponentCSS();
    let styleEl = document.getElementById('theme-component-styles');
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-component-styles';
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = componentCSS;
    
    // Añadir clase de tema al html
    root.classList.remove(...Array.from(root.classList).filter(c => c.startsWith('theme-')));
    root.classList.add(`theme-${this.theme.id}`);
    
    console.log(`[ThemeEngine] Theme applied successfully`);
    console.log(`[ThemeEngine] Generated ${Object.keys(cssVars).length} CSS variables`);
  }
  
  /**
   * Carga fuentes desde Google Fonts
   */
  loadFonts(): void {
    const theme = this.getMergedTheme();
    const families = Object.values(theme.tokens.typography.families);
    
    // Filtrar solo fuentes que no sean del sistema
    const googleFonts = families.filter(f => 
      !f.includes('system') && 
      !f.includes('-apple-system') &&
      !f.includes('BlinkMacSystemFont')
    );
    
    if (googleFonts.length === 0) {
      console.log('[ThemeEngine] No Google Fonts to load');
      return;
    }
    
    // Evitar cargar la misma fuente múltiples veces
    const existingLink = document.querySelector(`link[data-theme-fonts="${this.theme.id}"]`);
    if (existingLink) {
      existingLink.remove();
    }
    
    const link = document.createElement('link');
    link.setAttribute('data-theme-fonts', this.theme.id);
    link.href = `https://fonts.googleapis.com/css2?${googleFonts.map(f => {
      const family = f.split(',')[0].trim().replace(/['"]/g, '');
      return `family=${family.replace(/\s+/g, '+')}:wght@400;500;600;700`;
    }).join('&')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    console.log(`[ThemeEngine] Loaded ${googleFonts.length} font families`);
  }
  
  /**
   * Exporta el tema como JSON string
   */
  exportTheme(): string {
    return JSON.stringify(this.getMergedTheme(), null, 2);
  }
  
  /**
   * Debug: Imprime todas las variables generadas
   */
  debugVariables(): void {
    const vars = this.generateCSSVariables();
    console.group(`[ThemeEngine Debug] ${this.theme.name}`);
    console.table(vars);
    console.groupEnd();
  }
}

/**
 * Factory function para crear theme engine
 */
export function createThemeEngine(
  theme: ThemeDefinition,
  baseTheme?: ThemeDefinition
): ThemeEngine {
  return new ThemeEngine(theme, baseTheme);
}

/**
 * Helper para cargar tema desde URL
 */
export async function loadThemeFromURL(url: string): Promise<ThemeDefinition> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load theme from ${url}`);
  }
  return response.json();
}

/**
 * Validador simple de tema
 */
export function validateTheme(theme: any): theme is ThemeDefinition {
  return (
    theme &&
    typeof theme === 'object' &&
    typeof theme.id === 'string' &&
    typeof theme.name === 'string' &&
    theme.tokens &&
    theme.tokens.colors &&
    theme.tokens.typography &&
    theme.tokens.spacing &&
    theme.tokens.effects
  );
}
