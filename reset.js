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
      when: `{{exists(${q(backups.index.external)})}}`,
      method: "fs.copy",
      params: {
        src: backups.index.external,
        dest: backups.index.live
      }
    },
    {
      when: `{{!exists(${q(backups.index.external)}) && exists(${q(backups.index.sidecar)})}}`,
      method: "fs.copy",
      params: {
        src: backups.index.sidecar,
        dest: backups.index.live
      }
    },
    {
      when: `{{!exists(${q(backups.index.external)}) && !exists(${q(backups.index.sidecar)}) && exists(${q(backups.index.legacy)})}}`,
      method: "fs.copy",
      params: {
        src: backups.index.legacy,
        dest: backups.index.live
      }
    },
    {
      when: `{{exists(${q(backups.mainSidebar.external)})}}`,
      method: "fs.copy",
      params: {
        src: backups.mainSidebar.external,
        dest: backups.mainSidebar.live
      }
    },
    {
      when: `{{!exists(${q(backups.mainSidebar.external)}) && exists(${q(backups.mainSidebar.sidecar)})}}`,
      method: "fs.copy",
      params: {
        src: backups.mainSidebar.sidecar,
        dest: backups.mainSidebar.live
      }
    },
    {
      when: `{{!exists(${q(backups.mainSidebar.external)}) && !exists(${q(backups.mainSidebar.sidecar)}) && exists(${q(backups.mainSidebar.legacy)})}}`,
      method: "fs.copy",
      params: {
        src: backups.mainSidebar.legacy,
        dest: backups.mainSidebar.live
      }
    },
    {
      when: `{{exists(${q(backups.peerAccessPoints.external)})}}`,
      method: "fs.copy",
      params: {
        src: backups.peerAccessPoints.external,
        dest: backups.peerAccessPoints.live
      }
    },
    {
      when: `{{!exists(${q(backups.peerAccessPoints.external)}) && exists(${q(backups.peerAccessPoints.sidecar)})}}`,
      method: "fs.copy",
      params: {
        src: backups.peerAccessPoints.sidecar,
        dest: backups.peerAccessPoints.live
      }
    },
    {
      when: `{{!exists(${q(backups.peerAccessPoints.external)}) && !exists(${q(backups.peerAccessPoints.sidecar)}) && exists(${q(backups.peerAccessPoints.legacy)})}}`,
      method: "fs.copy",
      params: {
        src: backups.peerAccessPoints.legacy,
        dest: backups.peerAccessPoints.live
      }
    },
    {
      when: `{{!exists(${q(backups.index.external)}) && !exists(${q(backups.index.sidecar)}) && !exists(${q(backups.index.legacy)}) && exists(${q(backups.index.live)})}}`,
      method: "fs.rm",
      params: {
        path: backups.index.live
      }
    },
    {
      when: "{{exists('../../web/public/customokio.css')}}",
      method: "fs.rm",
      params: {
        path: "../../web/public/customokio.css"
      }
    },
    {
      when: "{{exists('../../web/public/customokio.js')}}",
      method: "fs.rm",
      params: {
        path: "../../web/public/customokio.js"
      }
    },
    {
      when: "{{exists('../../web/public/sortable.min.js')}}",
      method: "fs.rm",
      params: {
        path: "../../web/public/sortable.min.js"
      }
    },
    {
      when: `{{!exists(${q(backups.mainSidebar.external)}) && !exists(${q(backups.mainSidebar.sidecar)}) && !exists(${q(backups.mainSidebar.legacy)}) && exists(${q(backups.mainSidebar.live)})}}`,
      method: "fs.rm",
      params: {
        path: backups.mainSidebar.live
      }
    },
    {
      when: `{{!exists(${q(backups.peerAccessPoints.external)}) && !exists(${q(backups.peerAccessPoints.sidecar)}) && !exists(${q(backups.peerAccessPoints.legacy)}) && exists(${q(backups.peerAccessPoints.live)})}}`,
      method: "fs.rm",
      params: {
        path: backups.peerAccessPoints.live
      }
    },
    {
      when: "{{exists('state')}}",
      method: "fs.rm",
      params: {
        path: "state"
      }
    },
    {
      method: "app.refresh",
      params: {
        force: true
      }
    },
    {
      method: "notify",
      params: {
        html: "Customokio customization removed. Pinokio was asked to refresh its app index. If the stock home screen does not visibly return right away, refresh the Home page or restart Pinokio."
      }
    }
  ]
}
