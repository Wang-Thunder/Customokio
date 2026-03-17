module.exports = {
  run: [
    {
      when: "{{exists('state/backup/index.ejs')}}",
      method: "fs.copy",
      params: {
        src: "state/backup/index.ejs",
        dest: "../../web/views/index.ejs"
      }
    },
    {
      when: "{{exists('state/backup/partials/main_sidebar.ejs')}}",
      method: "fs.copy",
      params: {
        src: "state/backup/partials/main_sidebar.ejs",
        dest: "../../web/views/partials/main_sidebar.ejs"
      }
    },
    {
      when: "{{exists('state/backup/partials/peer_access_points.ejs')}}",
      method: "fs.copy",
      params: {
        src: "state/backup/partials/peer_access_points.ejs",
        dest: "../../web/views/partials/peer_access_points.ejs"
      }
    },
    {
      when: "{{!exists('state/backup/index.ejs') && exists('../../web/views/index.ejs')}}",
      method: "fs.rm",
      params: {
        path: "../../web/views/index.ejs"
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
      when: "{{!exists('state/backup/partials/main_sidebar.ejs') && exists('../../web/views/partials/main_sidebar.ejs')}}",
      method: "fs.rm",
      params: {
        path: "../../web/views/partials/main_sidebar.ejs"
      }
    },
    {
      when: "{{!exists('state/backup/partials/peer_access_points.ejs') && exists('../../web/views/partials/peer_access_points.ejs')}}",
      method: "fs.rm",
      params: {
        path: "../../web/views/partials/peer_access_points.ejs"
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
      method: "notify",
      params: {
        html: "Customokio customization removed. Refresh the Pinokio home page to restore the previous layout."
      }
    }
  ]
}
