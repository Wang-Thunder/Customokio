const os = require("os")
const path = require("path")

const normalize = (value) => value.replace(/\\/g, "/")
const q = (value) => JSON.stringify(value)

const externalBackupRoot = normalize(process.platform === "win32"
  ? path.resolve(os.homedir(), "AppData", "Roaming", "Pinokio", "Customokio", "backup")
  : process.platform === "darwin"
    ? path.resolve(os.homedir(), "Library", "Application Support", "Pinokio", "Customokio", "backup")
    : path.resolve(os.homedir(), ".config", "Pinokio", "Customokio", "backup"))

const backups = {
  index: {
    live: "../../web/views/index.ejs",
    external: normalize(path.resolve(externalBackupRoot, "index.ejs")),
    sidecar: "../../web/views/index.ejs.customokio.bak",
    legacy: "state/backup/index.ejs"
  },
  mainSidebar: {
    live: "../../web/views/partials/main_sidebar.ejs",
    external: normalize(path.resolve(externalBackupRoot, "partials", "main_sidebar.ejs")),
    sidecar: "../../web/views/partials/main_sidebar.ejs.customokio.bak",
    legacy: "state/backup/partials/main_sidebar.ejs"
  },
  peerAccessPoints: {
    live: "../../web/views/partials/peer_access_points.ejs",
    external: normalize(path.resolve(externalBackupRoot, "partials", "peer_access_points.ejs")),
    sidecar: "../../web/views/partials/peer_access_points.ejs.customokio.bak",
    legacy: "state/backup/partials/peer_access_points.ejs"
  }
}

module.exports = {
  run: [
    {
      when: `{{!exists(${q(backups.index.external)}) && exists(${q(backups.index.legacy)})}}`,
      method: "fs.copy",
      params: {
        src: backups.index.legacy,
        dest: backups.index.external
      }
    },
    {
      when: `{{!exists(${q(backups.mainSidebar.external)}) && exists(${q(backups.mainSidebar.legacy)})}}`,
      method: "fs.copy",
      params: {
        src: backups.mainSidebar.legacy,
        dest: backups.mainSidebar.external
      }
    },
    {
      when: `{{!exists(${q(backups.peerAccessPoints.external)}) && exists(${q(backups.peerAccessPoints.legacy)})}}`,
      method: "fs.copy",
      params: {
        src: backups.peerAccessPoints.legacy,
        dest: backups.peerAccessPoints.external
      }
    },
    {
      when: `{{!exists('state/installed.json') && !exists(${q(backups.index.external)}) && exists(${q(backups.index.live)})}}`,
      method: "fs.copy",
      params: {
        src: backups.index.live,
        dest: backups.index.external
      }
    },
    {
      when: `{{!exists('state/installed.json') && !exists(${q(backups.mainSidebar.external)}) && exists(${q(backups.mainSidebar.live)})}}`,
      method: "fs.copy",
      params: {
        src: backups.mainSidebar.live,
        dest: backups.mainSidebar.external
      }
    },
    {
      when: `{{!exists('state/installed.json') && !exists(${q(backups.peerAccessPoints.external)}) && exists(${q(backups.peerAccessPoints.live)})}}`,
      method: "fs.copy",
      params: {
        src: backups.peerAccessPoints.live,
        dest: backups.peerAccessPoints.external
      }
    },
    {
      when: `{{!exists(${q(backups.index.sidecar)}) && exists(${q(backups.index.external)})}}`,
      method: "fs.copy",
      params: {
        src: backups.index.external,
        dest: backups.index.sidecar
      }
    },
    {
      when: `{{!exists(${q(backups.mainSidebar.sidecar)}) && exists(${q(backups.mainSidebar.external)})}}`,
      method: "fs.copy",
      params: {
        src: backups.mainSidebar.external,
        dest: backups.mainSidebar.sidecar
      }
    },
    {
      when: `{{!exists(${q(backups.peerAccessPoints.sidecar)}) && exists(${q(backups.peerAccessPoints.external)})}}`,
      method: "fs.copy",
      params: {
        src: backups.peerAccessPoints.external,
        dest: backups.peerAccessPoints.sidecar
      }
    },
    {
      when: `{{!exists(${q(backups.index.sidecar)}) && exists(${q(backups.index.legacy)})}}`,
      method: "fs.copy",
      params: {
        src: backups.index.legacy,
        dest: backups.index.sidecar
      }
    },
    {
      when: `{{!exists(${q(backups.mainSidebar.sidecar)}) && exists(${q(backups.mainSidebar.legacy)})}}`,
      method: "fs.copy",
      params: {
        src: backups.mainSidebar.legacy,
        dest: backups.mainSidebar.sidecar
      }
    },
    {
      when: `{{!exists(${q(backups.peerAccessPoints.sidecar)}) && exists(${q(backups.peerAccessPoints.legacy)})}}`,
      method: "fs.copy",
      params: {
        src: backups.peerAccessPoints.legacy,
        dest: backups.peerAccessPoints.sidecar
      }
    },
    {
      when: `{{!exists('state/installed.json') && !exists(${q(backups.index.sidecar)}) && exists(${q(backups.index.live)})}}`,
      method: "fs.copy",
      params: {
        src: backups.index.live,
        dest: backups.index.sidecar
      }
    },
    {
      when: `{{!exists('state/installed.json') && !exists(${q(backups.mainSidebar.sidecar)}) && exists(${q(backups.mainSidebar.live)})}}`,
      method: "fs.copy",
      params: {
        src: backups.mainSidebar.live,
        dest: backups.mainSidebar.sidecar
      }
    },
    {
      when: `{{!exists('state/installed.json') && !exists(${q(backups.peerAccessPoints.sidecar)}) && exists(${q(backups.peerAccessPoints.live)})}}`,
      method: "fs.copy",
      params: {
        src: backups.peerAccessPoints.live,
        dest: backups.peerAccessPoints.sidecar
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "web/views/index.ejs",
        dest: backups.index.live
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "web/views/partials/main_sidebar.ejs",
        dest: backups.mainSidebar.live
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "web/views/partials/peer_access_points.ejs",
        dest: backups.peerAccessPoints.live
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "web/public/customokio.css",
        dest: "../../web/public/customokio.css"
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "web/public/customokio.js",
        dest: "../../web/public/customokio.js"
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "web/public/sortable.min.js",
        dest: "../../web/public/sortable.min.js"
      }
    },
    {
      method: "app.refresh",
      params: {
        force: true
      }
    },
    {
      method: "fs.write",
      params: {
        path: path.resolve(externalBackupRoot, "manifest.json"),
        json: {
          files: {
            index: backups.index.external,
            main_sidebar: backups.mainSidebar.external,
            peer_access_points: backups.peerAccessPoints.external
          },
          sidecars: {
            index: backups.index.sidecar,
            main_sidebar: backups.mainSidebar.sidecar,
            peer_access_points: backups.peerAccessPoints.sidecar
          },
          target: "../../web",
          updated_at: new Date().toISOString()
        }
      }
    },
    {
      method: "fs.write",
      params: {
        path: "state/installed.json",
        json: {
          installed: true,
          target: "../../web",
          external_backup_root: externalBackupRoot,
          sidecar_backup_suffix: ".customokio.bak"
        }
      }
    },
    {
      method: "notify",
      params: {
        html: "Customokio home customization applied. Pinokio was asked to refresh its app index. If the home screen does not visibly update right away, refresh the Home page or restart Pinokio. This is most likely when Apply was run while other apps were already open."
      }
    }
  ]
}
