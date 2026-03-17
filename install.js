module.exports = {
  run: [
    {
      when: "{{!exists('state/installed.json') && exists('../../web/views/index.ejs')}}",
      method: "fs.copy",
      params: {
        src: "../../web/views/index.ejs",
        dest: "state/backup/index.ejs"
      }
    },
    {
      when: "{{!exists('state/installed.json') && exists('../../web/views/partials/main_sidebar.ejs')}}",
      method: "fs.copy",
      params: {
        src: "../../web/views/partials/main_sidebar.ejs",
        dest: "state/backup/partials/main_sidebar.ejs"
      }
    },
    {
      when: "{{!exists('state/installed.json') && exists('../../web/views/partials/peer_access_points.ejs')}}",
      method: "fs.copy",
      params: {
        src: "../../web/views/partials/peer_access_points.ejs",
        dest: "state/backup/partials/peer_access_points.ejs"
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "web/views/index.ejs",
        dest: "../../web/views/index.ejs"
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "web/views/partials/main_sidebar.ejs",
        dest: "../../web/views/partials/main_sidebar.ejs"
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "web/views/partials/peer_access_points.ejs",
        dest: "../../web/views/partials/peer_access_points.ejs"
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
      method: "fs.write",
      params: {
        path: "state/installed.json",
        json: {
          installed: true,
          target: "../../web"
        }
      }
    },
    {
      method: "notify",
      params: {
        html: "Customokio home customization applied. Refresh the Pinokio home page to see grouped apps within the default Pinokio interface."
      }
    }
  ]
}
