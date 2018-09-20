# pull-scale-banner
a pull down scale the banner effect script.

## use like this:
```javascript
var pull = new pullScaleBanner({
    drager: '.main',
    scaler: '.banner-img'
});
pull.on('refresh', function () {
    console.log('pull begin');
    setTimeout(function () {
        pull.emit('success');
    }, 100)
});
```

## preview
> * [click here](https://yangyuji.github.io/pull-scale-banner/demo.html)
> * ![qrcode](https://github.com/yangyuji/pull-scale-banner/blob/master/qrcode.png)

## License
> * copyright(c) 2018 oujizeng Licensed under MIT license.
