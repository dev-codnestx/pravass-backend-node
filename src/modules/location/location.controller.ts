// import * as countryService from './country.service';
// import * as stateService from './state.service';
// import * as cityService from './city.service';
// import * as areaService from './area.service';

// const services = {
//   country: countryService,
//   state: stateService,
//   city: cityService,
//   area: areaService,
// };

// export const create = (type: keyof typeof services) => async (req, res) => {
//   const result = await services[type].create(req.body);
//   res.status(201).json(result);
// };

// export const get = (type: keyof typeof services) => async (req, res) => {
//   const result = await services[type].getById(req.params.id);
//   res.status(200).json(result);
// };

// export const update = (type: keyof typeof services) => async (req, res) => {
//   const result = await services[type].update(req.params.id, req.body);
//   res.status(200).json(result);
// };

// export const remove = (type: keyof typeof services) => async (req, res) => {
//   await services[type].remove(req.params.id);
//   res.status(204).send();
// };
