export type AspectRatioCategoryId =
  | "common"
  | "social"
  | "social_banners"
  | "print_iso"
  | "print_cards"
  | "print_posters"
  | "web_ui_ads";

export type AspectRatioOption = {
  id: string;
  value: string;
  ratio: string;
  labelKey: string;
  descriptionKey: string;
  promptHint: string;
};

export type AspectRatioGroup = {
  id: AspectRatioCategoryId;
  labelKey: string;
  descriptionKey: string;
  options: AspectRatioOption[];
};

export const ASPECT_RATIO_GROUPS: AspectRatioGroup[] = [
  {
    id: "common",
    labelKey: "promptSetup.aspectRatio.groups.common.label",
    descriptionKey: "promptSetup.aspectRatio.groups.common.description",
    options: [
      {
        id: "commonSquare",
        value: "common_square",
        ratio: "1:1",
        labelKey: "promptSetup.aspectRatio.options.commonSquare.label",
        descriptionKey: "promptSetup.aspectRatio.options.commonSquare.description",
        promptHint: "square layout, 1:1 ratio",
      },
      {
        id: "commonPortraitFourFive",
        value: "common_portrait_4_5",
        ratio: "4:5",
        labelKey: "promptSetup.aspectRatio.options.commonPortraitFourFive.label",
        descriptionKey: "promptSetup.aspectRatio.options.commonPortraitFourFive.description",
        promptHint: "portrait layout, 4:5 ratio",
      },
      {
        id: "commonLandscapeFiveFour",
        value: "common_landscape_5_4",
        ratio: "5:4",
        labelKey: "promptSetup.aspectRatio.options.commonLandscapeFiveFour.label",
        descriptionKey: "promptSetup.aspectRatio.options.commonLandscapeFiveFour.description",
        promptHint: "landscape layout, 5:4 ratio",
      },
      {
        id: "commonPortraitThreeFour",
        value: "common_portrait_3_4",
        ratio: "3:4",
        labelKey: "promptSetup.aspectRatio.options.commonPortraitThreeFour.label",
        descriptionKey: "promptSetup.aspectRatio.options.commonPortraitThreeFour.description",
        promptHint: "portrait layout, 3:4 ratio",
      },
      {
        id: "commonLandscapeFourThree",
        value: "common_landscape_4_3",
        ratio: "4:3",
        labelKey: "promptSetup.aspectRatio.options.commonLandscapeFourThree.label",
        descriptionKey: "promptSetup.aspectRatio.options.commonLandscapeFourThree.description",
        promptHint: "classic landscape layout, 4:3 ratio",
      },
      {
        id: "commonPhotoLandscape",
        value: "common_photo_landscape_3_2",
        ratio: "3:2",
        labelKey: "promptSetup.aspectRatio.options.commonPhotoLandscape.label",
        descriptionKey: "promptSetup.aspectRatio.options.commonPhotoLandscape.description",
        promptHint: "photo landscape layout, 3:2 ratio",
      },
      {
        id: "commonPhotoPortrait",
        value: "common_photo_portrait_2_3",
        ratio: "2:3",
        labelKey: "promptSetup.aspectRatio.options.commonPhotoPortrait.label",
        descriptionKey: "promptSetup.aspectRatio.options.commonPhotoPortrait.description",
        promptHint: "photo portrait layout, 2:3 ratio",
      },
      {
        id: "commonVertical",
        value: "common_vertical_9_16",
        ratio: "9:16",
        labelKey: "promptSetup.aspectRatio.options.commonVertical.label",
        descriptionKey: "promptSetup.aspectRatio.options.commonVertical.description",
        promptHint: "vertical mobile layout, 9:16 ratio",
      },
      {
        id: "commonWidescreen",
        value: "common_widescreen_16_9",
        ratio: "16:9",
        labelKey: "promptSetup.aspectRatio.options.commonWidescreen.label",
        descriptionKey: "promptSetup.aspectRatio.options.commonWidescreen.description",
        promptHint: "widescreen layout, 16:9 ratio",
      },
      {
        id: "commonCinematicWide",
        value: "common_cinematic_wide_21_9",
        ratio: "21:9",
        labelKey: "promptSetup.aspectRatio.options.commonCinematicWide.label",
        descriptionKey: "promptSetup.aspectRatio.options.commonCinematicWide.description",
        promptHint: "cinematic ultra-wide layout, 21:9 ratio",
      },
    ],
  },
  {
    id: "social",
    labelKey: "promptSetup.aspectRatio.groups.social.label",
    descriptionKey: "promptSetup.aspectRatio.groups.social.description",
    options: [
      {
        id: "instagramSquarePost",
        value: "social_instagram_square_post",
        ratio: "1:1",
        labelKey: "promptSetup.aspectRatio.options.instagramSquarePost.label",
        descriptionKey: "promptSetup.aspectRatio.options.instagramSquarePost.description",
        promptHint: "Instagram square post layout, 1:1 ratio",
      },
      {
        id: "instagramPortraitPost",
        value: "social_instagram_portrait_post",
        ratio: "4:5",
        labelKey: "promptSetup.aspectRatio.options.instagramPortraitPost.label",
        descriptionKey: "promptSetup.aspectRatio.options.instagramPortraitPost.description",
        promptHint: "Instagram portrait feed post layout, 4:5 ratio",
      },
      {
        id: "instagramPhotoPost",
        value: "social_instagram_photo_post_3_4",
        ratio: "3:4",
        labelKey: "promptSetup.aspectRatio.options.instagramPhotoPost.label",
        descriptionKey: "promptSetup.aspectRatio.options.instagramPhotoPost.description",
        promptHint: "Instagram photo post layout, 3:4 ratio",
      },
      {
        id: "instagramLandscapePost",
        value: "social_instagram_landscape_post",
        ratio: "1.91:1",
        labelKey: "promptSetup.aspectRatio.options.instagramLandscapePost.label",
        descriptionKey: "promptSetup.aspectRatio.options.instagramLandscapePost.description",
        promptHint: "Instagram landscape feed post layout, 1.91:1 ratio",
      },
      {
        id: "instagramStoryReel",
        value: "social_instagram_story_reel",
        ratio: "9:16",
        labelKey: "promptSetup.aspectRatio.options.instagramStoryReel.label",
        descriptionKey: "promptSetup.aspectRatio.options.instagramStoryReel.description",
        promptHint: "Instagram Story or Reel vertical layout, 9:16 ratio",
      },
      {
        id: "tiktokShortsReels",
        value: "social_tiktok_shorts_reels",
        ratio: "9:16",
        labelKey: "promptSetup.aspectRatio.options.tiktokShortsReels.label",
        descriptionKey: "promptSetup.aspectRatio.options.tiktokShortsReels.description",
        promptHint: "TikTok, YouTube Shorts, or Reels vertical video layout, 9:16 ratio",
      },
    ],
  },
  {
    id: "social_banners",
    labelKey: "promptSetup.aspectRatio.groups.socialBanners.label",
    descriptionKey: "promptSetup.aspectRatio.groups.socialBanners.description",
    options: [
      {
        id: "youtubeThumbnail",
        value: "social_youtube_thumbnail",
        ratio: "16:9",
        labelKey: "promptSetup.aspectRatio.options.youtubeThumbnail.label",
        descriptionKey: "promptSetup.aspectRatio.options.youtubeThumbnail.description",
        promptHint: "YouTube thumbnail layout, 16:9 ratio, bold readable composition",
      },
      {
        id: "youtubeChannelBanner",
        value: "social_youtube_channel_banner",
        ratio: "16:9",
        labelKey: "promptSetup.aspectRatio.options.youtubeChannelBanner.label",
        descriptionKey: "promptSetup.aspectRatio.options.youtubeChannelBanner.description",
        promptHint: "YouTube channel banner layout, 16:9 ratio, keep critical text and logo inside the central safe area",
      },
      {
        id: "xTwitterHeader",
        value: "social_x_twitter_header",
        ratio: "3:1",
        labelKey: "promptSetup.aspectRatio.options.xTwitterHeader.label",
        descriptionKey: "promptSetup.aspectRatio.options.xTwitterHeader.description",
        promptHint: "X / Twitter header banner layout, 3:1 ratio, wide horizontal composition",
      },
      {
        id: "facebookPageCover",
        value: "social_facebook_page_cover",
        ratio: "16:9",
        labelKey: "promptSetup.aspectRatio.options.facebookPageCover.label",
        descriptionKey: "promptSetup.aspectRatio.options.facebookPageCover.description",
        promptHint: "Facebook page cover layout, wide social banner composition, preserve safe margins for profile overlay and responsive cropping",
      },
      {
        id: "linkedinCover",
        value: "social_linkedin_cover",
        ratio: "4:1",
        labelKey: "promptSetup.aspectRatio.options.linkedinCover.label",
        descriptionKey: "promptSetup.aspectRatio.options.linkedinCover.description",
        promptHint: "LinkedIn cover banner layout, wide 4:1 composition with safe central content area",
      },
    ],
  },
  {
    id: "print_iso",
    labelKey: "promptSetup.aspectRatio.groups.printIso.label",
    descriptionKey: "promptSetup.aspectRatio.groups.printIso.description",
    options: [
      {
        id: "a6Portrait",
        value: "print_a6_portrait",
        ratio: "1:1.414",
        labelKey: "promptSetup.aspectRatio.options.a6Portrait.label",
        descriptionKey: "promptSetup.aspectRatio.options.a6Portrait.description",
        promptHint: "A6 portrait print layout, ISO paper ratio 1:1.414",
      },
      {
        id: "a6Landscape",
        value: "print_a6_landscape",
        ratio: "1.414:1",
        labelKey: "promptSetup.aspectRatio.options.a6Landscape.label",
        descriptionKey: "promptSetup.aspectRatio.options.a6Landscape.description",
        promptHint: "A6 landscape print layout, ISO paper ratio 1.414:1",
      },
      {
        id: "a5Portrait",
        value: "print_a5_portrait",
        ratio: "1:1.414",
        labelKey: "promptSetup.aspectRatio.options.a5Portrait.label",
        descriptionKey: "promptSetup.aspectRatio.options.a5Portrait.description",
        promptHint: "A5 portrait print layout, ISO paper ratio 1:1.414",
      },
      {
        id: "a5Landscape",
        value: "print_a5_landscape",
        ratio: "1.414:1",
        labelKey: "promptSetup.aspectRatio.options.a5Landscape.label",
        descriptionKey: "promptSetup.aspectRatio.options.a5Landscape.description",
        promptHint: "A5 landscape print layout, ISO paper ratio 1.414:1",
      },
      {
        id: "a4Portrait",
        value: "print_a4_portrait",
        ratio: "1:1.414",
        labelKey: "promptSetup.aspectRatio.options.a4Portrait.label",
        descriptionKey: "promptSetup.aspectRatio.options.a4Portrait.description",
        promptHint: "A4 portrait print layout, ISO paper ratio 1:1.414",
      },
      {
        id: "a4Landscape",
        value: "print_a4_landscape",
        ratio: "1.414:1",
        labelKey: "promptSetup.aspectRatio.options.a4Landscape.label",
        descriptionKey: "promptSetup.aspectRatio.options.a4Landscape.description",
        promptHint: "A4 landscape print layout, ISO paper ratio 1.414:1",
      },
      {
        id: "a3Portrait",
        value: "print_a3_portrait",
        ratio: "1:1.414",
        labelKey: "promptSetup.aspectRatio.options.a3Portrait.label",
        descriptionKey: "promptSetup.aspectRatio.options.a3Portrait.description",
        promptHint: "A3 portrait print layout, ISO paper ratio 1:1.414",
      },
      {
        id: "a3Landscape",
        value: "print_a3_landscape",
        ratio: "1.414:1",
        labelKey: "promptSetup.aspectRatio.options.a3Landscape.label",
        descriptionKey: "promptSetup.aspectRatio.options.a3Landscape.description",
        promptHint: "A3 landscape print layout, ISO paper ratio 1.414:1",
      },
      {
        id: "a2Portrait",
        value: "print_a2_portrait",
        ratio: "1:1.414",
        labelKey: "promptSetup.aspectRatio.options.a2Portrait.label",
        descriptionKey: "promptSetup.aspectRatio.options.a2Portrait.description",
        promptHint: "A2 portrait print layout, ISO paper ratio 1:1.414",
      },
      {
        id: "a2Landscape",
        value: "print_a2_landscape",
        ratio: "1.414:1",
        labelKey: "promptSetup.aspectRatio.options.a2Landscape.label",
        descriptionKey: "promptSetup.aspectRatio.options.a2Landscape.description",
        promptHint: "A2 landscape print layout, ISO paper ratio 1.414:1",
      },
      {
        id: "a1Portrait",
        value: "print_a1_portrait",
        ratio: "1:1.414",
        labelKey: "promptSetup.aspectRatio.options.a1Portrait.label",
        descriptionKey: "promptSetup.aspectRatio.options.a1Portrait.description",
        promptHint: "A1 portrait print layout, ISO paper ratio 1:1.414",
      },
      {
        id: "a1Landscape",
        value: "print_a1_landscape",
        ratio: "1.414:1",
        labelKey: "promptSetup.aspectRatio.options.a1Landscape.label",
        descriptionKey: "promptSetup.aspectRatio.options.a1Landscape.description",
        promptHint: "A1 landscape print layout, ISO paper ratio 1.414:1",
      },
      {
        id: "a0Portrait",
        value: "print_a0_portrait",
        ratio: "1:1.414",
        labelKey: "promptSetup.aspectRatio.options.a0Portrait.label",
        descriptionKey: "promptSetup.aspectRatio.options.a0Portrait.description",
        promptHint: "A0 portrait print layout, ISO paper ratio 1:1.414",
      },
      {
        id: "a0Landscape",
        value: "print_a0_landscape",
        ratio: "1.414:1",
        labelKey: "promptSetup.aspectRatio.options.a0Landscape.label",
        descriptionKey: "promptSetup.aspectRatio.options.a0Landscape.description",
        promptHint: "A0 landscape print layout, ISO paper ratio 1.414:1",
      },
    ],
  },
  {
    id: "print_cards",
    labelKey: "promptSetup.aspectRatio.groups.printCards.label",
    descriptionKey: "promptSetup.aspectRatio.groups.printCards.description",
    options: [
      {
        id: "businessCardHorizontal",
        value: "print_business_card_horizontal",
        ratio: "7:4",
        labelKey: "promptSetup.aspectRatio.options.businessCardHorizontal.label",
        descriptionKey: "promptSetup.aspectRatio.options.businessCardHorizontal.description",
        promptHint: "horizontal business card print layout, standard 7:4 ratio",
      },
      {
        id: "businessCardVertical",
        value: "print_business_card_vertical",
        ratio: "4:7",
        labelKey: "promptSetup.aspectRatio.options.businessCardVertical.label",
        descriptionKey: "promptSetup.aspectRatio.options.businessCardVertical.description",
        promptHint: "vertical business card print layout, standard 4:7 ratio",
      },
      {
        id: "squareBusinessCard",
        value: "print_square_business_card",
        ratio: "1:1",
        labelKey: "promptSetup.aspectRatio.options.squareBusinessCard.label",
        descriptionKey: "promptSetup.aspectRatio.options.squareBusinessCard.description",
        promptHint: "square business card print layout, 1:1 ratio",
      },
      {
        id: "postcardHorizontal",
        value: "print_postcard_horizontal",
        ratio: "3:2",
        labelKey: "promptSetup.aspectRatio.options.postcardHorizontal.label",
        descriptionKey: "promptSetup.aspectRatio.options.postcardHorizontal.description",
        promptHint: "horizontal postcard print layout, 3:2 ratio",
      },
      {
        id: "postcardVertical",
        value: "print_postcard_vertical",
        ratio: "2:3",
        labelKey: "promptSetup.aspectRatio.options.postcardVertical.label",
        descriptionKey: "promptSetup.aspectRatio.options.postcardVertical.description",
        promptHint: "vertical postcard print layout, 2:3 ratio",
      },
      {
        id: "invitationPortrait",
        value: "print_invitation_portrait_5_7",
        ratio: "5:7",
        labelKey: "promptSetup.aspectRatio.options.invitationPortrait.label",
        descriptionKey: "promptSetup.aspectRatio.options.invitationPortrait.description",
        promptHint: "portrait invitation card print layout, 5:7 ratio",
      },
      {
        id: "invitationLandscape",
        value: "print_invitation_landscape_7_5",
        ratio: "7:5",
        labelKey: "promptSetup.aspectRatio.options.invitationLandscape.label",
        descriptionKey: "promptSetup.aspectRatio.options.invitationLandscape.description",
        promptHint: "landscape invitation card print layout, 7:5 ratio",
      },
      {
        id: "greetingCardSquare",
        value: "print_greeting_card_square",
        ratio: "1:1",
        labelKey: "promptSetup.aspectRatio.options.greetingCardSquare.label",
        descriptionKey: "promptSetup.aspectRatio.options.greetingCardSquare.description",
        promptHint: "square greeting card print layout, 1:1 ratio",
      },
    ],
  },
  {
    id: "print_posters",
    labelKey: "promptSetup.aspectRatio.groups.printPosters.label",
    descriptionKey: "promptSetup.aspectRatio.groups.printPosters.description",
    options: [
      {
        id: "posterPortraitTwoThree",
        value: "print_poster_portrait_2_3",
        ratio: "2:3",
        labelKey: "promptSetup.aspectRatio.options.posterPortraitTwoThree.label",
        descriptionKey: "promptSetup.aspectRatio.options.posterPortraitTwoThree.description",
        promptHint: "portrait poster layout, 2:3 ratio",
      },
      {
        id: "posterLandscapeThreeTwo",
        value: "print_poster_landscape_3_2",
        ratio: "3:2",
        labelKey: "promptSetup.aspectRatio.options.posterLandscapeThreeTwo.label",
        descriptionKey: "promptSetup.aspectRatio.options.posterLandscapeThreeTwo.description",
        promptHint: "landscape poster layout, 3:2 ratio",
      },
      {
        id: "posterPortraitThreeFour",
        value: "print_poster_portrait_3_4",
        ratio: "3:4",
        labelKey: "promptSetup.aspectRatio.options.posterPortraitThreeFour.label",
        descriptionKey: "promptSetup.aspectRatio.options.posterPortraitThreeFour.description",
        promptHint: "portrait poster layout, 3:4 ratio",
      },
      {
        id: "posterLandscapeFourThree",
        value: "print_poster_landscape_4_3",
        ratio: "4:3",
        labelKey: "promptSetup.aspectRatio.options.posterLandscapeFourThree.label",
        descriptionKey: "promptSetup.aspectRatio.options.posterLandscapeFourThree.description",
        promptHint: "landscape poster layout, 4:3 ratio",
      },
      {
        id: "posterPortraitFourFive",
        value: "print_poster_portrait_4_5",
        ratio: "4:5",
        labelKey: "promptSetup.aspectRatio.options.posterPortraitFourFive.label",
        descriptionKey: "promptSetup.aspectRatio.options.posterPortraitFourFive.description",
        promptHint: "portrait poster layout, 4:5 ratio",
      },
      {
        id: "posterLandscapeFiveFour",
        value: "print_poster_landscape_5_4",
        ratio: "5:4",
        labelKey: "promptSetup.aspectRatio.options.posterLandscapeFiveFour.label",
        descriptionKey: "promptSetup.aspectRatio.options.posterLandscapeFiveFour.description",
        promptHint: "landscape poster layout, 5:4 ratio",
      },
      {
        id: "moviePoster",
        value: "print_movie_poster",
        ratio: "2:3",
        labelKey: "promptSetup.aspectRatio.options.moviePoster.label",
        descriptionKey: "promptSetup.aspectRatio.options.moviePoster.description",
        promptHint: "movie poster layout, portrait 2:3 ratio, strong title and cinematic visual hierarchy",
      },
      {
        id: "albumCover",
        value: "print_album_cover",
        ratio: "1:1",
        labelKey: "promptSetup.aspectRatio.options.albumCover.label",
        descriptionKey: "promptSetup.aspectRatio.options.albumCover.description",
        promptHint: "album cover layout, square 1:1 ratio",
      },
      {
        id: "bookCover",
        value: "print_book_cover",
        ratio: "2:3",
        labelKey: "promptSetup.aspectRatio.options.bookCover.label",
        descriptionKey: "promptSetup.aspectRatio.options.bookCover.description",
        promptHint: "book cover layout, portrait 2:3 ratio, readable title area and cover design hierarchy",
      },
      {
        id: "magazineCover",
        value: "print_magazine_cover",
        ratio: "3:4",
        labelKey: "promptSetup.aspectRatio.options.magazineCover.label",
        descriptionKey: "promptSetup.aspectRatio.options.magazineCover.description",
        promptHint: "magazine cover layout, portrait 3:4 ratio, editorial cover composition",
      },
    ],
  },
  {
    id: "web_ui_ads",
    labelKey: "promptSetup.aspectRatio.groups.webUiAds.label",
    descriptionKey: "promptSetup.aspectRatio.groups.webUiAds.description",
    options: [
      {
        id: "websiteHeroWide",
        value: "web_website_hero_wide",
        ratio: "16:9",
        labelKey: "promptSetup.aspectRatio.options.websiteHeroWide.label",
        descriptionKey: "promptSetup.aspectRatio.options.websiteHeroWide.description",
        promptHint: "website hero section layout, wide 16:9 ratio",
      },
      {
        id: "websiteHeroUltraWide",
        value: "web_website_hero_ultra_wide",
        ratio: "21:9",
        labelKey: "promptSetup.aspectRatio.options.websiteHeroUltraWide.label",
        descriptionKey: "promptSetup.aspectRatio.options.websiteHeroUltraWide.description",
        promptHint: "website hero section layout, ultra-wide 21:9 ratio",
      },
      {
        id: "webBannerWide",
        value: "web_banner_wide",
        ratio: "3:1",
        labelKey: "promptSetup.aspectRatio.options.webBannerWide.label",
        descriptionKey: "promptSetup.aspectRatio.options.webBannerWide.description",
        promptHint: "wide web banner layout, 3:1 ratio",
      },
      {
        id: "leaderboardAd",
        value: "web_leaderboard_ad",
        ratio: "8:1",
        labelKey: "promptSetup.aspectRatio.options.leaderboardAd.label",
        descriptionKey: "promptSetup.aspectRatio.options.leaderboardAd.description",
        promptHint: "leaderboard display ad layout, very wide 8:1 ratio",
      },
      {
        id: "mediumRectangleAd",
        value: "web_medium_rectangle_ad",
        ratio: "6:5",
        labelKey: "promptSetup.aspectRatio.options.mediumRectangleAd.label",
        descriptionKey: "promptSetup.aspectRatio.options.mediumRectangleAd.description",
        promptHint: "medium rectangle display ad layout, 6:5 ratio",
      },
      {
        id: "squareAd",
        value: "web_square_ad",
        ratio: "1:1",
        labelKey: "promptSetup.aspectRatio.options.squareAd.label",
        descriptionKey: "promptSetup.aspectRatio.options.squareAd.description",
        promptHint: "square digital ad layout, 1:1 ratio",
      },
      {
        id: "appSplashPortrait",
        value: "web_app_splash_portrait",
        ratio: "9:16",
        labelKey: "promptSetup.aspectRatio.options.appSplashPortrait.label",
        descriptionKey: "promptSetup.aspectRatio.options.appSplashPortrait.description",
        promptHint: "mobile app splash screen portrait layout, 9:16 ratio",
      },
      {
        id: "appSplashLandscape",
        value: "web_app_splash_landscape",
        ratio: "16:9",
        labelKey: "promptSetup.aspectRatio.options.appSplashLandscape.label",
        descriptionKey: "promptSetup.aspectRatio.options.appSplashLandscape.description",
        promptHint: "app splash screen landscape layout, 16:9 ratio",
      },
    ],
  },
];

export function getDefaultAspectRatioValue() {
  return ASPECT_RATIO_GROUPS[0]?.options[0]?.value || "common_square";
}

export function findAspectRatioOption(value?: string) {
  if (!value) return null;

  const allOptions = ASPECT_RATIO_GROUPS.flatMap((group) => group.options);

  return (
    allOptions.find((option) => option.value === value) ||
    allOptions.find((option) => option.ratio === value) ||
    null
  );
}

export function findAspectRatioGroupByOption(value?: string) {
  if (!value) return null;

  return (
    ASPECT_RATIO_GROUPS.find((group) => {
      return group.options.some((option) => {
        return option.value === value || option.ratio === value;
      });
    }) || null
  );
}

export function getAspectRatioPromptHint(value?: string) {
  const option = findAspectRatioOption(value);

  return option?.promptHint || value || getDefaultAspectRatioValue();
}

export function getAspectRatioRatio(value?: string) {
  const option = findAspectRatioOption(value);

  return option?.ratio || value || "1:1";
}