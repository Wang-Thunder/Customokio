module.exports = {
  version: "5.0",
  title: "Customokio",
  description: "A grouped and nested Pinokio home screen with drag-and-drop categories, export/import, and reversible installation.",
  menu: async (kernel, info) => {
    const installed = info.exists("state/installed.json")
    const running = {
      install: info.running("install.js"),
      reapply: info.running("reapply.js"),
      update: info.running("update.js"),
      reset: info.running("reset.js")
    }

    if (running.install) {
      return [{
        default: true,
        icon: "fa-solid fa-wand-magic-sparkles",
        text: "Applying",
        href: "install.js"
      }]
    }

    if (running.update) {
      return [{
        default: true,
        icon: "fa-solid fa-rotate",
        text: "Updating",
        href: "update.js"
      }]
    }

    if (running.reapply) {
      return [{
        default: true,
        icon: "fa-solid fa-arrows-rotate",
        text: "Reapplying",
        href: "reapply.js"
      }]
    }

    if (running.reset) {
      return [{
        default: true,
        icon: "fa-solid fa-rotate-left",
        text: "Restoring",
        href: "reset.js"
      }]
    }

    if (installed) {
      return [{
        default: true,
        icon: "fa-solid fa-book",
        text: "README",
        href: "README.md?raw=true"
      }, {
        icon: "fa-solid fa-cloud-arrow-down",
        text: "Update + Reapply",
        href: "update.js"
      }, {
        icon: "fa-solid fa-arrows-rotate",
        text: "Reapply",
        href: "reapply.js"
      }, {
        icon: "fa-solid fa-triangle-exclamation",
        text: "Safe Remove",
        href: "reset.js",
        confirm: "Restore the default Pinokio home and remove Customokio?"
      }]
    }

    return [{
      default: true,
      icon: "fa-solid fa-book",
      text: "README",
      href: "README.md?raw=true"
    }, {
      icon: "fa-solid fa-wand-magic-sparkles",
      text: "Apply",
      href: "install.js"
    }]
  }
}
