# Deploying to EC2

This app is **intentionally vulnerable** (broken authorization demo). You
chose to expose it to the whole internet, which is fine for a public
CTF/workshop — just don't reuse this instance for anything else, and don't
put real credentials/data on it.

## 1. Push to git

```bash
cd /Users/yugendransunder/Documents/frontend-vuln-app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

The repo needs to be reachable from the EC2 instance at boot. Easiest is a
**public** GitHub repo (fine here — this is fake demo data, seeded bcrypt
hashes of throwaway passwords, not real secrets). If you'd rather keep it
private, either attach a deploy key on the instance or embed a GitHub
personal access token in the clone URL in `deploy/user-data.sh` — but note
anyone with access to the instance (or its metadata) can then read that
token, so a public repo is simpler and safer for a disposable demo box.

## 2. Edit `deploy/user-data.sh`

Open [deploy/user-data.sh](deploy/user-data.sh) and set:

```bash
GIT_REPO_URL="https://github.com/<your-username>/<your-repo>.git"
GIT_BRANCH="main"
```

## 3. Launch the instance (AWS Console) with User data

1. EC2 → Launch instance.
2. AMI: **Ubuntu 22.04 LTS**.
3. Instance type: `t2.micro` / `t3.micro` (free-tier eligible).
4. Key pair: create or pick one you have the `.pem` for (only needed if you
   want to SSH in later to check logs — the app itself bootstraps without it).
5. Network settings → Edit → Security group rules:
   - SSH (22) — source: **My IP** (recommended, keeps management access to you even though the app itself will be public)
   - HTTP (80) — source: **Anywhere (0.0.0.0/0)** — this is the app, intentionally public per your choice
6. Advanced details → **User data** → paste the full contents of your edited `deploy/user-data.sh`.
7. Launch. Note the instance's **Public IPv4 address**.

(If you'd rather use the CLI: run `aws configure` first with an access
key/secret — `aws sts get-caller-identity` currently fails here with
`InvalidClientTokenId`, so no credentials are set up on this machine. Once
configured I can run the `aws ec2 run-instances` command with
`--user-data file://deploy/user-data.sh` for you instead of the console
steps above.)

## 4. Verify

User data takes a minute or two to run on first boot (installing Node,
cloning, `npm install`, starting services). Then open
`http://<EC2-PUBLIC-IP>/` in a browser. Log in with the seeded accounts
(`admin`/`Admin@123`, `bob`/`Bob@123`, `carol`/`Carol@123`) — same
credentials as local, since `server/data/*.json` is committed to the repo.

If SSH access is set up, useful commands on the instance:

```bash
sudo tail -f /var/log/user-data.log   # bootstrap script output
sudo systemctl status bookshelf       # app status
sudo journalctl -u bookshelf -f       # app logs
sudo systemctl restart bookshelf
```

## 5. Redeploying after changes

Push your changes to git, then on the instance:

```bash
cd ~/frontend-vuln-app
git pull
npm install --omit=dev
sudo systemctl restart bookshelf
```

(`deploy/setup.sh` is kept for a manual/scp-based install without user
data or git, if you ever need it as a fallback.)

## Cleaning up

When you're done with the demo, terminate the instance (EC2 console →
Instances → select it → Instance state → Terminate) so it doesn't keep
running/billing — t2.micro is free-tier eligible for the first 12 months
but only up to the monthly free-tier hour limit.
