const {
  withMainApplication,
  withAndroidManifest,
  withDangerousMod,
  withStringsXml,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin para Vulpis:
 * Copia los archivos nativos Kotlin, layouts y drawables del AppWidget de Android,
 * registra el receptor en AndroidManifest.xml y enlaza VulpisWidgetPackage en MainApplication.kt.
 */
const withVulpisWidgetFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidAppDir = path.join(projectRoot, 'android', 'app', 'src', 'main');
      const androidSrcDir = path.join(androidAppDir, 'java', 'com', 'anthofu', 'Vulpis');
      const pluginSrcDir = path.join(projectRoot, 'plugins', 'android');

      if (!fs.existsSync(androidSrcDir)) {
        fs.mkdirSync(androidSrcDir, { recursive: true });
      }

      // 1. Copiar archivos fuente Kotlin
      const kotlinFiles = [
        'VulpisWidgetProvider.kt',
        'VulpisWidgetModule.kt',
        'VulpisWidgetPackage.kt',
      ];

      for (const file of kotlinFiles) {
        const src = path.join(pluginSrcDir, file);
        const dest = path.join(androidSrcDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      // 2. Copiar recursos XML (layouts, drawables, appwidget-provider info)
      const resDir = path.join(pluginSrcDir, 'res');
      if (fs.existsSync(resDir)) {
        const copyDirRecursive = (srcDir, destDir) => {
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          const entries = fs.readdirSync(srcDir, { withFileTypes: true });
          for (const entry of entries) {
            const srcPath = path.join(srcDir, entry.name);
            const destPath = path.join(destDir, entry.name);
            if (entry.isDirectory()) {
              copyDirRecursive(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        };

        copyDirRecursive(resDir, path.join(androidAppDir, 'res'));
      }

      return config;
    },
  ]);
};

/**
 * Agrega strings al archivo strings.xml.
 */
const withVulpisWidgetStrings = (config) => {
  return withStringsXml(config, (config) => {
    const strings = config.modResults.resources.string || [];

    const stringDefs = [
      { name: 'widget_name', value: 'Reproductor Vulpis' },
      { name: 'widget_description', value: 'Controla tu música y visualiza la carátula desde la pantalla de inicio.' },
      { name: 'widget_default_title', value: 'Vulpis Music' },
      { name: 'widget_default_artist', value: 'Toca para reproducir' },
    ];

    for (const def of stringDefs) {
      if (!strings.some((item) => item.$.name === def.name)) {
        strings.push({
          $: { name: def.name },
          _: def.value,
        });
      }
    }

    config.modResults.resources.string = strings;
    return config;
  });
};

/**
 * Registra el receptor VulpisWidgetProvider en AndroidManifest.xml.
 */
const withVulpisWidgetManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (!mainApplication) return config;

    const receivers = mainApplication.receiver || [];
    const receiverName = '.VulpisWidgetProvider';

    if (!receivers.some((r) => r.$?.['android:name'] === receiverName)) {
      receivers.push({
        $: {
          'android:name': receiverName,
          'android:label': '@string/widget_name',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
              { $: { 'android:name': 'com.anthofu.Vulpis.ACTION_WIDGET_PLAY_PAUSE' } },
              { $: { 'android:name': 'com.anthofu.Vulpis.ACTION_WIDGET_NEXT' } },
              { $: { 'android:name': 'com.anthofu.Vulpis.ACTION_WIDGET_PREV' } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/vulpis_widget_info',
            },
          },
        ],
      });
    }

    mainApplication.receiver = receivers;
    return config;
  });
};

/**
 * Enlaza VulpisWidgetPackage en MainApplication.kt.
 */
const withVulpisWidgetMainApp = (config) => {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes('VulpisWidgetPackage()')) {
      contents = contents.replace(
        'PackageList(this).packages.apply {',
        `PackageList(this).packages.apply {\n          add(VulpisWidgetPackage())`
      );
      config.modResults.contents = contents;
    }
    return config;
  });
};

const withVulpisWidget = (config) => {
  return withVulpisWidgetMainApp(
    withVulpisWidgetManifest(
      withVulpisWidgetStrings(withVulpisWidgetFiles(config))
    )
  );
};

module.exports = createRunOncePlugin(withVulpisWidget, 'vulpis-widget', '1.0.0');
