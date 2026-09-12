#!/usr/bin/env bash
set -euo pipefail
root=/var/www/budget.jonmb.com/app
release_id=${1:?Missing release identifier}
[[ "$release_id" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || exit 1
release="$root/releases/$release_id"
# Non-interactive SSH sessions do not normally load nvm.
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  source "$HOME/.nvm/nvm.sh" --no-use
  nvm use 22 >/dev/null
fi
command -v pm2 >/dev/null
node -e 'if (Number(process.versions.node.split(".")[0]) !== 22) process.exit(1)'
[[ -f "$root/shared/.env" && -f "$release/server.js" ]]
[[ ! -e "$root/current" || -L "$root/current" ]] || { echo 'current must be a symlink'; exit 1; }
previous=$(readlink "$root/current" || true)
mkdir -p "$root/shared/sessions"
chmod 700 "$root/shared/sessions"
activate() {
  ln -s "$1" "$root/current.next" || return 1
  mv -Tf "$root/current.next" "$root/current" || return 1
  pm2 startOrRestart "$root/current/ecosystem.config.cjs" --only budget-app --update-env
}
healthy() {
  for attempt in {1..15}; do
    if curl --fail --silent --max-time 2 http://127.0.0.1:3003/app/health >/dev/null; then return 0; fi
    sleep 2
  done
  return 1
}
if activate "$release" && healthy; then
  pm2 save
  echo "Deployed $release_id"
else
  echo 'Deployment failed.' >&2
  if [[ -n "$previous" ]]; then
    activate "$previous"
    pm2 save
    echo 'Previous version restored.' >&2
  else
    pm2 stop budget-app || true
  fi
  exit 1
fi
