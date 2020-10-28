module.exports = function domToNode(domNode) {
  if (domNode.nodeType == domNode.TEXT_NODE) {
    return /^\s+$/.test(domNode.data) ? " " : domNode.data;
  }
  if (domNode.nodeType != domNode.ELEMENT_NODE) {
    return false;
  }
  var nodeElement = {};
  nodeElement.tag = domNode.tagName.toLowerCase();
  for (var i = 0; i < domNode.attributes.length; i++) {
    var attr = domNode.attributes[i];
    if (!nodeElement.attrs) {
      nodeElement.attrs = {};
    }
    if ("href src data-srcset alt srcset".includes(attr.name)) {
      nodeElement.attrs[attr.name] = attr.value;
    }
  }
  if (domNode.childNodes.length > 0) {
    nodeElement.children = [];
    for (var i = 0; i < domNode.childNodes.length; i++) {
      var child = domNode.childNodes[i];
      nodeElement.children.push(domToNode(child));
    }
  }
  return nodeElement;
};
