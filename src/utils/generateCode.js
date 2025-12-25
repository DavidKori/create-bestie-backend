import { nanoid } from "nanoid";

export default generateSecretCode = () => {
  return `bestie_${nanoid(8)}`;
};
