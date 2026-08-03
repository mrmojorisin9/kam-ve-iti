# n8n self-hosted na Oracle Cloud Free Tier (Faza 6-7, ADR-020, Korak 5)

n8n i `automation/` žive u **istom** Docker kontejneru (vidi `Dockerfile` —
razlog u komentaru ondje). Pristup n8n web sučelju ide isključivo preko
**SSH tunela**, VM nema ništa javno izloženo osim SSH-a — nema potrebe za
domenom/HTTPS certifikatom za jedan admin alat kojem pristupa samo ti
povremeno (domena `kamdenes.hr` je zasebna, odgođena tema — PROJECT_BRIEF).

## 1. Oracle Cloud račun + VM (radiš ti, u pregledniku)

1. Registracija na [cloud.oracle.com](https://cloud.oracle.com) → "Start for free". Traži karticu radi verifikacije identiteta, ali **Always Free** resursi se ne naplaćuju dok ostaješ unutar limita.
2. Nakon prijave: **Compute → Instances → Create Instance**.
3. **Image and shape:**
   - Image: **Ubuntu 22.04** (ili noviji LTS).
   - Shape: klikni "Change shape" → **Ampere (ARM)** → `VM.Standard.A1.Flex` → 2 OCPU / 12 GB RAM je dovoljno i ostaje unutar Always Free limita (do 4 OCPU/24GB ukupno besplatno).
4. **Networking:** ostavi default VCN/subnet. **Ne otvaraj** dodatne portove u Security List-u — jedino SSH (22) treba biti dostupan, što je default.
5. **Add SSH keys:** odaberi "Generate a key pair for me" i **preuzmi privatni ključ** (`.key` datoteka) — treba ti za spajanje. Ako već imaš SSH par, može i "Upload public key".
6. **Create.** Za par minuta instanca je "Running" — zapiši njen **Public IP** (prikazan na stranici instance).

## 2. Spajanje i instalacija Dockera (SSH)

Sa svog računala (PowerShell ili Git Bash):

```bash
chmod 400 putanja/do/preuzetog-kljuca.key
ssh -i putanja/do/preuzetog-kljuca.key ubuntu@<PUBLIC_IP>
```

Na VM-u (Ubuntu 22.04 ima Docker u default repou, ali novija verzija je pouzdanija preko službenog skripta):

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Odjavi se i ponovno spoji (`exit`, pa opet `ssh ...`) da članstvo u `docker` grupi vrijedi bez `sudo` na svaki `docker` poziv.

## 3. Kopiranje repoa na VM

Najjednostavnije — kloniraj ovaj GitHub repo izravno na VM (treba mu samo `git clone`, kredencijali/tokeni idu zasebno u `.env`, ne u git repo):

```bash
git clone https://github.com/<tvoj-github-korisnik>/kam-ve-iti.git
cd kam-ve-iti
```

## 4. Konfiguracija i pokretanje

```bash
cd automation/deploy
cp .env.example .env
nano .env    # ili vi/vim — popuni sve vrijednosti (iste kao lokalni automation/.env + basic auth za n8n)
docker compose up -d --build
```

Prvi build traje par minuta (instalira Python ovisnosti u image). `docker compose logs -f n8n` da pratiš napredak/greške.

## 5. Pristup n8n sučelju (SSH tunel, ne javno)

Sa svog računala, **u novom terminalu** (ostavi ga otvorenim dok radiš u n8n-u):

```bash
ssh -i putanja/do/kljuca.key -L 5678:localhost:5678 ubuntu@<PUBLIC_IP>
```

Zatim otvori `http://localhost:5678` u svom pregledniku — prijava s `N8N_BASIC_AUTH_USER`/`PASSWORD` iz `.env`.

## 6. Uvoz workflowa i podešavanje

1. n8n sučelje → **Workflows → Import from File** → odaberi `automation/n8n/scraper-workflow.json` (sa svog računala — n8n editor prima upload iz preglednika, ne treba biti na VM-u).
2. Otvori uvezeni workflow, provjeri "Cron (dnevno)" čvor (podesi vrijeme ako želiš drugačije od defaulta) i "Execute Command" čvor (naredba je već točna za ovaj setup — vidi `Dockerfile`).
3. **Aktiviraj workflow** (toggle gore desno).
4. Test: klikni "Execute Workflow" ručno jednom, provjeri output "Execute Command" čvora (treba izgledati kao lokalni dry-run/run ispis iz `pipeline.py`).
5. Provjeri `/admin/dogadjaji?status=pending_review` na portalu — novi/ažurirani redovi trebaju se pojaviti nakon uspješnog pokretanja.

## Održavanje (buduće izmjene koda)

Kad promijeniš nešto u `automation/` (novi izvor, popravak adaptera) i pushaš na GitHub:

```bash
ssh -i kljuc.key ubuntu@<PUBLIC_IP>
cd kam-ve-iti && git pull
cd automation/deploy && docker compose up -d --build
```

Rebuild podigne novi kod bez gubitka n8n workflow povijesti (`n8n_data` je odvojen Docker volume, nedirano rebuild-om).
