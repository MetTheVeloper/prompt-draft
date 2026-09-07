# Typography module

Module key: `typography`
Source: `app/modules/typography.module.ts`

## Real top-level fields

### `textGroups`
Structured `textGroups` editor. A group can contain one or more real text blocks.

Group-level choices:
- `groupPurpose`: `poster_header`, `poster_footer`, `product_info`, `event_info`, `music_cover_info`, `advertising_copy`, `badge_cluster`, `side_caption`, `typographic_background`, `credits_area`, `custom`.
- `positionPreset`: `top`, `top_left`, `top_center`, `top_right`, `center_left`, `center`, `center_right`, `bottom_left`, `bottom_center`, `bottom_right`, `bottom`, `left_side`, `right_side`, `custom`.
- `direction`: `row`, `column`.
- `writingDirection`: `ltr`, `rtl`, `vertical_ttb`, `vertical_btt`.
- `alignment`: `start`, `center`, `end`, `justify`.
- `distribution`: `compact`, `balanced`, `spaced`, `scattered`.

Text-block choices:
- `purpose`: `main_title`, `subtitle`, `slogan`, `artist_name`, `brand_name`, `product_name`, `price`, `discount`, `date`, `time`, `location`, `caption`, `warning_label`, `badge_text`, `footer_note`, `credits`, `call_to_action`, `custom`.
- `fontStyle`: `clean_sans`, `bold_display`, `elegant_serif`, `condensed_poster`, `handwritten`, `gothic_blackletter`, `monospaced`, `graffiti`, `retro_script`, `minimal_editorial`, `custom`.
- `fontSize`: `tiny`, `small`, `medium`, `large`, `huge`, `hero`, `custom`.
- `fontWeight`: `light`, `regular`, `medium`, `semibold`, `bold`, `extrabold`, `black`, `custom`.

Structured custom companions exist in the data contract for group/text purposes, position, font style, font size, and font weight (for example `customGroupPurpose`, `customPositionDescription`, `customPurpose`, `customFontStyle`, `customFontSize`, `customFontWeight`). Use those as **Custom by field** when the corresponding selector is `custom`.

Each text block also has the real editable values `layerName`, `text`, and `additionalDescription`; groups have `groupName` and `additionalDescription`.

### `textAccuracy`
`flexible`, `readable`, `exact`.

### `extraDetails`
Additive typography details.

### `customText`
Global override (`isOverride: true`), strongly discouraged.

## Recommendation rule

Typography is a strong example where field-level custom is better than override. If the requested font style or semantic purpose is not built in, choose `custom` only for that nested field and populate its companion custom value.