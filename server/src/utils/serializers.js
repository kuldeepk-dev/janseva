function toPublicDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function toPublicDocs(docs) {
  return docs.map(toPublicDoc);
}

module.exports = { toPublicDoc, toPublicDocs };
