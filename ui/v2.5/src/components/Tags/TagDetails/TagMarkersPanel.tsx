import React from "react";
import * as GQL from "src/core/generated-graphql";
import { ListFilterModel } from "src/models/list-filter/filter";
import {
  TagsCriterion,
  TagsCriterionOption,
} from "src/models/list-filter/criteria/tags";
import { SceneMarkerList } from "src/components/Scenes/SceneMarkerList";
import { View } from "src/components/List/views";
import { useTagUpdate } from "src/core/StashService";
import { useToast } from "src/hooks/Toast";
import { useIntl } from "react-intl";
import ImageUtils from "src/utils/image";
import { showWhenSingleSelection } from "src/components/List/ItemList";

function useFilterHook(tag: GQL.TagDataFragment, showSubTagContent?: boolean) {
  return (filter: ListFilterModel) => {
    const tagValue = { id: tag.id, label: tag.name };
    // if tag is already present, then we modify it, otherwise add
    let tagCriterion = filter.criteria.find((c) => {
      return c.criterionOption.type === "tags";
    }) as TagsCriterion | undefined;

    if (
      tagCriterion &&
      (tagCriterion.modifier === GQL.CriterionModifier.IncludesAll ||
        tagCriterion.modifier === GQL.CriterionModifier.Includes)
    ) {
      // add the tag if not present
      if (
        !tagCriterion.value.items.find((p) => {
          return p.id === tag.id;
        })
      ) {
        tagCriterion.value.items.push(tagValue);
      }

      tagCriterion.modifier = GQL.CriterionModifier.IncludesAll;
    } else {
      // overwrite
      tagCriterion = new TagsCriterion(TagsCriterionOption);
      tagCriterion.value = {
        items: [tagValue],
        excluded: [],
        depth: showSubTagContent ? -1 : 0,
      };
      filter.criteria.push(tagCriterion);
    }

    return filter;
  };
}

interface ITagMarkersPanel {
  active: boolean;
  tag: GQL.TagDataFragment;
  showSubTagContent?: boolean;
}

export const TagMarkersPanel: React.FC<ITagMarkersPanel> = ({
  active,
  tag,
  showSubTagContent,
}) => {
  const intl = useIntl();
  const Toast = useToast();
  const [updateTag] = useTagUpdate();
  const filterHook = useFilterHook(tag, showSubTagContent);

  async function setCover(
    result: GQL.FindSceneMarkersQueryResult,
    _filter: ListFilterModel,
    selectedIds: Set<string>
  ) {
    const selectedMarkerID = selectedIds.values().next();
    if (!tag.id || selectedMarkerID.done) {
      return;
    }

    const selectedMarker = result.data?.findSceneMarkers?.scene_markers.find(
      (marker) => marker.id === selectedMarkerID.value
    );
    const imageURL = selectedMarker?.screenshot ?? selectedMarker?.preview;
    if (!imageURL) {
      return;
    }

    try {
      const coverImage = await ImageUtils.imageToDataURL(imageURL);
      await updateTag({
        variables: {
          input: {
            id: tag.id,
            image: coverImage,
          },
        },
      });
      Toast.success(
        intl.formatMessage(
          { id: "toast.updated_entity" },
          { entity: intl.formatMessage({ id: "tag" }).toLocaleLowerCase() }
        )
      );
    } catch (e) {
      Toast.error(e);
    }
  }

  const extraOperations = [
    {
      text: intl.formatMessage({ id: "actions.set_cover" }),
      onClick: setCover,
      isDisplayed: showWhenSingleSelection,
    },
  ];

  return (
    <SceneMarkerList
      filterHook={filterHook}
      alterQuery={active}
      view={View.TagMarkers}
      extraOperations={extraOperations}
    />
  );
};
