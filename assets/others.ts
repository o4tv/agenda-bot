export const rm_acentos = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export const cap = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
