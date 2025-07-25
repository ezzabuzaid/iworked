```bash
npx nx generate @nx/react:application --directory=apps --linter=eslint --name=apps/doctor --unitTestRunner=none --e2eTestRunner=none --minimal=true --routing=true --style=tailwind --useProjectJson=true --useReactRouter=true --no-interactive --compiler babel
```

We are moving from current settings page to use the settgins dialog, clean out current dialog settings and use ours.

we need 4 sections.

1. Project info (name, spec)
2. Project auth (apiurl, login url)
3. commands/prompts (keep it empty for now)
