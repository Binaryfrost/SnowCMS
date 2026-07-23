import Model from '../../Model';

export default class CollectionInputModel extends Model {
  private id: string;
  private collectionId: string;
  private input: string;
  private name: string;
  private fieldName: string;
  private description: string;
  private required: boolean;
  private inputConfig: Record<string, any>;
  private order: number;

  constructor(
    id: string,
    collectionId: string,
    input: string,
    name: string,
    fieldName: string,
    description: string,
    required: boolean,
    inputConfig: Record<string, any>,
    order: number
  ) {
    super();
    this.id = id;
    this.collectionId = collectionId;
    this.input = input;
    this.name = name;
    this.fieldName = fieldName;
    this.description = description;
    this.required = required;
    this.inputConfig = inputConfig;
    this.order = order;
  }

  getId() {
    return this.id;
  }

  getCollectionId() {
    return this.collectionId;
  }

  getInput() {
    return this.input;
  }

  getName() {
    return this.name;
  }

  getFieldName() {
    return this.fieldName;
  }

  getDescription() {
    return this.description;
  }

  isRequired() {
    return this.required;
  }

  getInputConfig() {
    return this.inputConfig;
  }

  getOrder() {
    return this.order;
  }
}
