import { MESSAGE_TYPE, REQUIRE } from './const';
let notify = (data) => {
    try{
        window.postMessage({
            type: MESSAGE_TYPE,
            module: REQUIRE,
            data
        }, "*");
    } catch (e) {
        console.log('=> require notify: ', e );
    }
};

export { notify };
