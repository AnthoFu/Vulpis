const { withMainApplication, withDangerousMod, createRunOncePlugin } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin para Vulpis:
 * Copia los archivos nativos Kotlin del ecualizador e inyecta VulpisEqualizerPackage en MainApplication.kt.
 */
const withVulpisEqualizerFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidSrcDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'anthofu',
        'Vulpis'
      );

      if (!fs.existsSync(androidSrcDir)) {
        fs.mkdirSync(androidSrcDir, { recursive: true });
      }

      const pluginSrcDir = path.join(projectRoot, 'plugins', 'android');
      const filesToCopy = ['VulpisEqualizerModule.kt', 'VulpisEqualizerPackage.kt'];

      for (const file of filesToCopy) {
        const src = path.join(pluginSrcDir, file);
        const dest = path.join(androidSrcDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      return config;
    },
  ]);
};

const withVulpisEqualizerMainApp = (config) => {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes('VulpisEqualizerPackage()')) {
      contents = contents.replace(
        'PackageList(this).packages.apply {',
        `PackageList(this).packages.apply {\n          add(VulpisEqualizerPackage())`
      );
      config.modResults.contents = contents;
    }
    return config;
  });
};

const withVulpisEqualizer = (config) => {
  return withVulpisEqualizerMainApp(withVulpisEqualizerFiles(config));
};

module.exports = createRunOncePlugin(withVulpisEqualizer, 'vulpis-equalizer', '1.0.0');
