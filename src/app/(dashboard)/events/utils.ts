import { type EventActions } from "@prisma/client";

export function getAction(event: EventActions) {
  return {
    CREATE_ACCOUNT: `criou a conta 🎉`,
    CREATE_STORE: `criou a loja 🏗`,
    UPDATE_STORE: `atualizou as informações da loja 🔧`,
    CREATE_COLLECTION: `criou uma coleção 🗂`,
    CREATE_PRODUCT: `criou um produto 🏷`,
    UPDATE_COLLECTION: `atualizou uma coleção 🔧`,
    UPDATE_PRODUCT: `atualizou um produto 🔨`,
    ARCHIVE_COLLECTION: `arquivou uma coleção 🗄`,
    UNARCHIVE_COLLECTION: `restaurou uma coleção 🔖`,
    DELETE_COLLECTION: `removeu uma coleção 🪓`,
    ARCHIVE_PRODUCT: `arquivou um produto 🗄`,
    UNARCHIVE_PRODUCT: `restaurou um produto 🗃`,
    DELETE_PRODUCT: `removeu um produto 🗑️`,
    CREATE_KEY: `criou uma chave 🔑`,
    REVOKE_KEY: `revogou uma chave 🔐`,
    CREATE_ORDER: `carrinho criado 🛒`,
    UPDATE_ORDER: `carrinho atualizado 🛒`,
    ARCHIVE_ORDER: `carrinho excluido 🛒`,
    EXPIRED_ORDER: `carrinho expirado 🛒`,
  }[event];
}
