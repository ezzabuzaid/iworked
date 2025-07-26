import { type Tree, createProjectGraphAsync, getProjects } from '@nx/devkit';
import { type SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { join } from 'path';

const UI_PACKAGES = ['shadcn', 'ui'];

export default async function updateTailwindGlobsGenerator(
  tree: Tree,
): Promise<SyncGeneratorResult> {
  const projectGraph = await createProjectGraphAsync();
  const apps = getProjects(tree)
    .entries()
    .filter(([, config]) => config.projectType === 'application')
    .map(([name, config]) => ({ name, src: config.sourceRoot! }));
  for (const { name, src } of apps) {
    const dependencies = new Set<string>();
    const queue = [name];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const deps = projectGraph.dependencies[current] || [];
      deps.forEach((dep) => {
        dependencies.add(dep.target);
        queue.push(dep.target);
      });
    }

    // Generate @source directives for each dependency
    const sourceDirectives: string[] = [];

    // Add patterns for each dependency
    dependencies.forEach((dep) => {
      const project = projectGraph.nodes[dep];
      if (
        project &&
        project.data.root &&
        project.data.name &&
        UI_PACKAGES.includes(project.data.name)
      ) {
        const relativePath = join('../../../', project.data.root);
        sourceDirectives.push(`@source "${relativePath}";`);
      }
    });

    // Sort for consistency
    sourceDirectives.sort();

    const stylesPath = join(src, 'styles.css');
    const currentContent = tree.read(stylesPath)?.toString() || '';

    const importIndex = currentContent.indexOf(`@import 'tailwindcss';`);
    if (importIndex === -1) {
      continue;
    }

    // Extract existing @source directives
    const sourceRegex = /@source\s+"[^"]+";/g;
    const existingSourcesMatch = currentContent.match(sourceRegex) || [];
    const existingSources = new Set(existingSourcesMatch.map((s) => s.trim()));

    // Check if we need to update
    const needsUpdate =
      sourceDirectives.length !== existingSources.size ||
      sourceDirectives.some((directive) => !existingSources.has(directive));

    if (needsUpdate) {
      // Remove all existing @source directives
      let cleanedContent = currentContent;

      // Remove @source lines (including newlines)
      cleanedContent = cleanedContent.replace(/\n@source\s+"[^"]+";/g, '');

      // Find the import line again in cleaned content
      const cleanImportIndex = cleanedContent.indexOf('@import "tailwindcss";');
      const cleanImportEndIndex =
        cleanedContent.indexOf('\n', cleanImportIndex) + 1;

      // Insert new @source directives after the import
      const beforeImport = cleanedContent.substring(0, cleanImportEndIndex);
      const afterImport = cleanedContent.substring(cleanImportEndIndex);

      // Add source directives with proper formatting
      const sourcesBlock =
        sourceDirectives.length > 0
          ? '\n' + sourceDirectives.join('\n') + '\n'
          : '';

      const newContent = beforeImport + sourcesBlock + afterImport;

      tree.write(stylesPath, newContent);
      return {
        outOfSyncMessage: `Tailwind @source directives updated. Added ${sourceDirectives.length} source directives.`,
      };
    }
  }

  return {};
}
