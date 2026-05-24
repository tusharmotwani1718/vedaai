// input: 2027-02-19T00:00:00.000Z; return -> 19-02-2027
export const convertDatetoString = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}